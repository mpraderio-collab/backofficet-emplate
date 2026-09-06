"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
}

export type BulkUpdateState = {
  error?: string;
  updatedCount?: number;
};

export async function bulkUpdatePrices(
  _prev: BulkUpdateState,
  formData: FormData,
): Promise<BulkUpdateState> {
  await requireAuth();

  const productIds = formData.getAll("productIds").map(String);
  const percent = Number(formData.get("percent"));

  if (productIds.length === 0) {
    return { error: "Seleccioná al menos un producto." };
  }
  if (!Number.isFinite(percent) || percent === 0) {
    return { error: "Ingresá un porcentaje distinto de 0." };
  }
  if (percent <= -100) {
    return { error: "El porcentaje no puede bajar el precio a 0 o menos." };
  }

  const factor = 1 + percent / 100;
  const products = await db.product.findMany({ where: { id: { in: productIds } } });

  await db.$transaction(
    products.map((p) =>
      db.product.update({
        where: { id: p.id },
        data: {
          price: Math.round(p.price * factor),
          cost: p.cost != null ? Math.round(p.cost * factor) : undefined,
          fractionPrice: p.fractionPrice != null ? Math.round(p.fractionPrice * factor) : undefined,
          priceUpdatedAt: new Date(),
        },
      }),
    ),
  );

  revalidatePath("/products");
  return { updatedCount: products.length };
}
