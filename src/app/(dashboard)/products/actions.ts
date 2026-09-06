"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { put } from "@vercel/blob";
import type { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { productSchema } from "@/lib/validation";

// Sube la foto elegida a Vercel Blob y devuelve su URL, o null si no se
// eligió ningún archivo nuevo (para no pisar la imagen ya guardada).
async function uploadProductImage(formData: FormData): Promise<string | null> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return null;
  const blob = await put(`products/${crypto.randomUUID()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: false,
  });
  return blob.url;
}

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
    minStock: formData.get("minStock"),
    supplierId: formData.get("supplierId"),
    // Estos tres campos no se renderizan cuando "sellsByFraction" está
    // apagado, así que formData.get() devuelve null (no ""), lo que
    // rompía la validación de Zod (espera string | undefined, no null).
    fractionUnit: formData.get("fractionUnit") ?? "",
    unitSize: formData.get("unitSize") ?? "",
    fractionPrice: formData.get("fractionPrice") ?? "",
    brand: formData.get("brand"),
    animalType: formData.get("animalType"),
    animalSize: formData.get("animalSize"),
    animalWeight: formData.get("animalWeight"),
    registeredAt: formData.get("registeredAt"),
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

// Si el producto no se vende por fracción, hay que limpiar explícitamente
// unitSize/fractionPrice a null — si no, un update con esos campos en
// `undefined` dejaría el valor anterior sin tocar en vez de borrarlo.
function toProductData(data: z.infer<typeof productSchema>) {
  return {
    ...data,
    fractionUnit: data.fractionUnit ?? null,
    unitSize: data.fractionUnit ? (data.unitSize ?? null) : null,
    fractionPrice: data.fractionUnit ? (data.fractionPrice ?? null) : null,
    minStock: data.minStock ?? null,
  };
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

  const imageUrl = await uploadProductImage(formData);

  let productId: string;
  try {
    const product = await db.product.create({
      data: { ...toProductData(result.data), imageUrl, priceUpdatedAt: new Date() },
    });
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

  const imageUrl = await uploadProductImage(formData);
  const removeImage = formData.get("removeImage") === "on";

  const existing = await db.product.findUnique({
    where: { id },
    select: { price: true, cost: true },
  });
  const priceChanged =
    existing != null &&
    (existing.price !== result.data.price || existing.cost !== (result.data.cost ?? null));

  try {
    await db.product.update({
      where: { id },
      data: {
        ...toProductData(result.data),
        ...(imageUrl ? { imageUrl } : removeImage ? { imageUrl: null } : {}),
        ...(priceChanged ? { priceUpdatedAt: new Date() } : {}),
      },
    });
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
