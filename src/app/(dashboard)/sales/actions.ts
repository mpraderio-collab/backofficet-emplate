"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { saleSchema } from "@/lib/validation";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
}

export type SaleActionState = {
  error?: string;
  saleId?: string;
};

class SaleError extends Error {}

export async function createSale(
  _prev: SaleActionState,
  formData: FormData,
): Promise<SaleActionState> {
  await requireAuth();

  let itemsRaw: unknown;
  try {
    itemsRaw = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Los ítems de la venta no son válidos." };
  }

  const result = saleSchema.safeParse({
    customerId: formData.get("customerId"),
    note: formData.get("note"),
    items: itemsRaw,
    initialPayment: formData.get("initialPayment"),
    initialPaymentMethod: formData.get("initialPaymentMethod"),
  });
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Revisá los datos." };
  }

  const data = result.data;

  try {
    const sale = await db.$transaction(async (tx) => {
      let total = 0;
      const saleItemsData: {
        productId: string;
        saleUnit: string;
        quantity: number;
        unitPrice: number;
        stockDelta: number;
      }[] = [];

      for (const line of data.items) {
        const product = await tx.product.findUnique({ where: { id: line.productId } });
        if (!product || product.status !== "active") {
          throw new SaleError("Uno de los productos ya no está disponible.");
        }

        // Update condicional: solo descuenta si hay stock suficiente en ese
        // instante, evitando vender de más si dos ventas chocan a la vez.
        // stockDelta siempre está en la unidad base del stock (ej: kg),
        // sin importar si se vendió por bolsa completa o por fracción.
        const updated = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: line.stockDelta } },
          data: { stock: { decrement: line.stockDelta } },
        });
        if (updated.count === 0) {
          throw new SaleError(`Sin stock suficiente de ${product.name}.`);
        }

        total += line.unitPrice * line.quantity;
        saleItemsData.push({
          productId: product.id,
          saleUnit: line.saleUnit,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          stockDelta: line.stockDelta,
        });
      }

      const initialPayment = Math.min(data.initialPayment, total);

      const created = await tx.sale.create({
        data: {
          customerId: data.customerId,
          total,
          note: data.note || null,
          items: { create: saleItemsData },
        },
      });

      // Toda venta genera un cargo en la cuenta corriente del cliente.
      await tx.customerLedgerEntry.create({
        data: {
          customerId: data.customerId,
          type: "charge",
          amount: total,
          saleId: created.id,
        },
      });

      // Entrega parcial (o total) del cliente al momento de la venta.
      if (initialPayment > 0) {
        await tx.customerLedgerEntry.create({
          data: {
            customerId: data.customerId,
            type: "payment",
            amount: initialPayment,
            paymentMethod: data.initialPaymentMethod,
            note: "Entrega al momento de la venta",
          },
        });
      }

      return created;
    });

    revalidatePath("/sales");
    revalidatePath("/products");
    revalidatePath(`/customers/${data.customerId}`);
    revalidatePath("/customers");
    return { saleId: sale.id };
  } catch (err) {
    if (err instanceof SaleError) return { error: err.message };
    throw err;
  }
}

// Cancela la venta: repone el stock y anula el cargo que había generado en
// la cuenta corriente del cliente (deja registrado el motivo, no borra
// el historial).
export async function cancelSale(id: string): Promise<{ error?: string }> {
  await requireAuth();

  const sale = await db.sale.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!sale) return { error: "La venta ya no existe." };
  if (sale.status === "cancelled") return {};

  await db.$transaction([
    ...sale.items.map((item) =>
      db.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.stockDelta } },
      }),
    ),
    db.sale.update({ where: { id }, data: { status: "cancelled" } }),
    db.customerLedgerEntry.create({
      data: {
        customerId: sale.customerId,
        type: "payment",
        amount: sale.total,
        note: "Anulación de venta cancelada",
      },
    }),
  ]);

  revalidatePath("/sales");
  revalidatePath(`/sales/${id}`);
  revalidatePath("/products");
  revalidatePath(`/customers/${sale.customerId}`);
  revalidatePath("/customers");
  return {};
}
