"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { purchaseOrderSchema, receivePurchaseOrderSchema } from "@/lib/validation";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user.id;
}

export type PurchaseOrderActionState = {
  error?: string;
  purchaseOrderId?: string;
};

export async function createPurchaseOrder(
  _prev: PurchaseOrderActionState,
  formData: FormData,
): Promise<PurchaseOrderActionState> {
  const userId = await requireAuth();

  let itemsRaw: unknown;
  try {
    itemsRaw = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Los ítems del pedido no son válidos." };
  }

  const result = purchaseOrderSchema.safeParse({
    supplierId: formData.get("supplierId"),
    note: formData.get("note"),
    items: itemsRaw,
    orderDate: formData.get("orderDate"),
  });
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Revisá los datos." };
  }

  const data = result.data;

  const purchaseOrder = await db.purchaseOrder.create({
    data: {
      supplierId: data.supplierId,
      note: data.note || null,
      orderDate: data.orderDate,
      createdByUserId: userId,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      },
      statusEvents: { create: { status: "pending", createdByUserId: userId } },
    },
  });

  revalidatePath("/purchase-orders");
  return { purchaseOrderId: purchaseOrder.id };
}

// Solo se puede seguir editando un pedido mientras está en "pending" —
// una vez enviado, cambiar los ítems desincronizaría lo que el proveedor
// ya recibió como pedido.
export async function updatePurchaseOrder(
  id: string,
  _prev: PurchaseOrderActionState,
  formData: FormData,
): Promise<PurchaseOrderActionState> {
  await requireAuth();

  let itemsRaw: unknown;
  try {
    itemsRaw = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Los ítems del pedido no son válidos." };
  }

  const result = purchaseOrderSchema.safeParse({
    supplierId: formData.get("supplierId"),
    note: formData.get("note"),
    items: itemsRaw,
    orderDate: formData.get("orderDate"),
  });
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Revisá los datos." };
  }

  const po = await db.purchaseOrder.findUnique({ where: { id } });
  if (!po) return { error: "El pedido ya no existe." };
  if (po.status !== "pending") {
    return { error: `Solo se puede modificar un pedido en estado "pending" (este está "${po.status}").` };
  }

  const data = result.data;

  await db.$transaction([
    db.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } }),
    db.purchaseOrder.update({
      where: { id },
      data: {
        supplierId: data.supplierId,
        note: data.note || null,
        ...(data.orderDate ? { orderDate: data.orderDate } : {}),
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
          })),
        },
      },
    }),
  ]);

  revalidatePath("/purchase-orders");
  revalidatePath(`/purchase-orders/${id}`);
  return { purchaseOrderId: id };
}

const allowedTransitions: Record<string, string[]> = {
  pending: ["sent", "cancelled"],
  sent: ["pending", "cancelled"],
  received: [],
  cancelled: [],
};

export async function updatePurchaseOrderStatus(
  id: string,
  nextStatus: string,
): Promise<{ error?: string }> {
  const userId = await requireAuth();

  const po = await db.purchaseOrder.findUnique({ where: { id } });
  if (!po) return { error: "El pedido ya no existe." };

  if (!allowedTransitions[po.status]?.includes(nextStatus)) {
    return { error: `No se puede pasar de "${po.status}" a "${nextStatus}".` };
  }

  await db.purchaseOrder.update({
    where: { id },
    data: {
      status: nextStatus,
      statusEvents: { create: { status: nextStatus, createdByUserId: userId } },
    },
  });

  revalidatePath("/purchase-orders");
  revalidatePath(`/purchase-orders/${id}`);
  return {};
}

// Recibir el pedido permite ajustar la cantidad realmente recibida de cada
// ítem (puede diferir de lo pedido) antes de sumar al stock y generar el
// cargo en la cuenta corriente del proveedor — por eso no es una simple
// transición de estado como las demás.
export async function receivePurchaseOrder(
  id: string,
  items: { itemId: string; receivedQuantity: number; newCost?: number }[],
): Promise<{ error?: string }> {
  const userId = await requireAuth();

  const po = await db.purchaseOrder.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!po) return { error: "El pedido ya no existe." };
  if (po.status !== "sent") {
    return { error: `No se puede recibir un pedido en estado "${po.status}".` };
  }

  const result = receivePurchaseOrderSchema.safeParse({ items });
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Revisá las cantidades." };
  }

  const receivedByItemId = new Map(
    result.data.items.map((i) => [i.itemId, i.receivedQuantity]),
  );
  const newCostByItemId = new Map(
    result.data.items.map((i) => [i.itemId, i.newCost]),
  );
  for (const item of po.items) {
    if (!receivedByItemId.has(item.id)) {
      return { error: "Faltan cantidades para algún producto del pedido." };
    }
  }

  // Las cantidades del pedido están en unidades completas (ej: bolsas);
  // el stock del producto se lleva en su unidad base (ej: kg), así que
  // hay que multiplicar por unitSize antes de sumarlo.
  const products = await db.product.findMany({
    where: { id: { in: po.items.map((item) => item.productId) } },
    select: { id: true, unitSize: true },
  });
  const unitSizeByProductId = new Map(products.map((p) => [p.id, p.unitSize ?? 1]));

  const total = po.items.reduce((sum, item) => {
    const receivedQuantity = receivedByItemId.get(item.id) ?? 0;
    return sum + item.unitCost * receivedQuantity;
  }, 0);

  await db.$transaction([
    ...po.items.map((item) => {
      const receivedQuantity = receivedByItemId.get(item.id) ?? 0;
      const stockDelta = receivedQuantity * (unitSizeByProductId.get(item.productId) ?? 1);
      const newCost = newCostByItemId.get(item.id);
      return db.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: stockDelta },
          ...(newCost != null ? { cost: newCost, priceUpdatedAt: new Date() } : {}),
        },
      });
    }),
    ...po.items.map((item) => {
      const receivedQuantity = receivedByItemId.get(item.id) ?? 0;
      const stockDelta = receivedQuantity * (unitSizeByProductId.get(item.productId) ?? 1);
      return db.purchaseOrderItem.update({
        where: { id: item.id },
        data: { receivedQuantity, stockDelta },
      });
    }),
    db.purchaseOrder.update({
      where: { id },
      data: {
        status: "received",
        statusEvents: { create: { status: "received", createdByUserId: userId } },
      },
    }),
    db.supplierLedgerEntry.create({
      data: {
        supplierId: po.supplierId,
        type: "charge",
        amount: total,
        purchaseOrderId: id,
        createdByUserId: userId,
      },
    }),
  ]);

  revalidatePath("/purchase-orders");
  revalidatePath(`/purchase-orders/${id}`);
  revalidatePath("/products");
  revalidatePath(`/suppliers/${po.supplierId}`);
  revalidatePath("/suppliers");
  return {};
}
