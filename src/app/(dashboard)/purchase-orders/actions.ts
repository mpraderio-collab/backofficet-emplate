"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { purchaseOrderSchema } from "@/lib/validation";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
}

export type PurchaseOrderActionState = {
  error?: string;
  purchaseOrderId?: string;
};

export async function createPurchaseOrder(
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
  });
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Revisá los datos." };
  }

  const data = result.data;

  const purchaseOrder = await db.purchaseOrder.create({
    data: {
      supplierId: data.supplierId,
      note: data.note || null,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      },
    },
  });

  revalidatePath("/purchase-orders");
  return { purchaseOrderId: purchaseOrder.id };
}

const allowedTransitions: Record<string, string[]> = {
  pending: ["sent", "cancelled"],
  sent: ["received", "cancelled"],
  received: [],
  cancelled: [],
};

export async function updatePurchaseOrderStatus(
  id: string,
  nextStatus: string,
): Promise<{ error?: string }> {
  await requireAuth();

  const po = await db.purchaseOrder.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!po) return { error: "El pedido ya no existe." };

  if (!allowedTransitions[po.status]?.includes(nextStatus)) {
    return { error: `No se puede pasar de "${po.status}" a "${nextStatus}".` };
  }

  if (nextStatus === "received") {
    const total = po.items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);

    // Las cantidades del pedido están en unidades completas (ej: bolsas);
    // el stock del producto se lleva en su unidad base (ej: kg), así que
    // hay que multiplicar por unitSize antes de sumarlo.
    const products = await db.product.findMany({
      where: { id: { in: po.items.map((item) => item.productId) } },
      select: { id: true, unitSize: true },
    });
    const unitSizeByProductId = new Map(products.map((p) => [p.id, p.unitSize ?? 1]));

    await db.$transaction([
      ...po.items.map((item) => {
        const stockDelta = item.quantity * (unitSizeByProductId.get(item.productId) ?? 1);
        return db.product.update({
          where: { id: item.productId },
          data: { stock: { increment: stockDelta } },
        });
      }),
      ...po.items.map((item) => {
        const stockDelta = item.quantity * (unitSizeByProductId.get(item.productId) ?? 1);
        return db.purchaseOrderItem.update({
          where: { id: item.id },
          data: { stockDelta },
        });
      }),
      db.purchaseOrder.update({ where: { id }, data: { status: nextStatus } }),
      db.supplierLedgerEntry.create({
        data: {
          supplierId: po.supplierId,
          type: "charge",
          amount: total,
          purchaseOrderId: id,
        },
      }),
    ]);
  } else {
    await db.purchaseOrder.update({ where: { id }, data: { status: nextStatus } });
  }

  revalidatePath("/purchase-orders");
  revalidatePath(`/purchase-orders/${id}`);
  revalidatePath("/products");
  revalidatePath(`/suppliers/${po.supplierId}`);
  revalidatePath("/suppliers");
  return {};
}
