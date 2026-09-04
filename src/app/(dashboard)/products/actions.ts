"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { productSchema } from "@/lib/validation";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
}

export type ProductActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function parseForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    description: formData.get("description"),
    price: formData.get("price"),
    cost: formData.get("cost"),
    stock: formData.get("stock"),
    supplierId: formData.get("supplierId"),
  });
}

function toFieldErrors(result: ReturnType<typeof parseForm>) {
  if (result.success) return {};
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

export async function createProduct(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireAuth();

  const result = parseForm(formData);
  if (!result.success) {
    return { error: "Revisá los campos marcados.", fieldErrors: toFieldErrors(result) };
  }

  let productId: string;
  try {
    const product = await db.product.create({ data: result.data });
    productId = product.id;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        error: "Ya existe un producto con ese SKU.",
        fieldErrors: { sku: "Este SKU ya está en uso" },
      };
    }
    throw err;
  }

  revalidatePath("/products");
  redirect(`/products/${productId}`);
}

export async function updateProduct(
  id: string,
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireAuth();

  const result = parseForm(formData);
  if (!result.success) {
    return { error: "Revisá los campos marcados.", fieldErrors: toFieldErrors(result) };
  }

  try {
    await db.product.update({ where: { id }, data: result.data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        error: "Ya existe un producto con ese SKU.",
        fieldErrors: { sku: "Este SKU ya está en uso" },
      };
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return { error: "Este producto ya no existe." };
    }
    throw err;
  }

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  return {};
}

// Un producto con ventas o pedidos asociados no se puede borrar sin romper
// el historial, así que se archiva en vez de eliminarse.
export async function archiveProduct(id: string) {
  await requireAuth();
  await db.product.update({ where: { id }, data: { status: "archived" } });
  revalidatePath("/products");
}

export async function restoreProduct(id: string) {
  await requireAuth();
  await db.product.update({ where: { id }, data: { status: "active" } });
  revalidatePath("/products");
}

export async function deleteProduct(id: string): Promise<{ error?: string }> {
  await requireAuth();

  const [saleCount, purchaseCount] = await Promise.all([
    db.saleItem.count({ where: { productId: id } }),
    db.purchaseOrderItem.count({ where: { productId: id } }),
  ]);
  if (saleCount > 0 || purchaseCount > 0) {
    return {
      error: "Este producto tiene ventas o pedidos asociados. Archivalo en vez de borrarlo.",
    };
  }

  await db.product.delete({ where: { id } });
  revalidatePath("/products");
  return {};
}
