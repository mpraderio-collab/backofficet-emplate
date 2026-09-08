"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { put } from "@vercel/blob";
import type { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { productSchema, productStockSchema } from "@/lib/validation";
import { getActiveBranchId } from "@/lib/branch";

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
    animalWeight: formData.get("animalWeight"),
    subrubroId: formData.get("subrubroId"),
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
// stock/minStock no son columnas de Product (son por sucursal, ver
// ProductStock) — se excluyen acá y se manejan aparte en createProduct.
function toProductData(data: z.infer<typeof productSchema>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- se excluyen a propósito, ver comentario arriba
  const { stock: _stock, minStock: _minStock, ...rest } = data;
  return {
    ...rest,
    fractionUnit: data.fractionUnit ?? null,
    unitSize: data.fractionUnit ? (data.unitSize ?? null) : null,
    fractionPrice: data.fractionUnit ? (data.fractionPrice ?? null) : null,
  };
}

export async function createProduct(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireAuth();
  const activeBranchId = await getActiveBranchId();
  if (!activeBranchId) {
    return { error: "Creá una sucursal antes de cargar productos." };
  }

  const result = parseForm(formData);
  if (!result.success) {
    return { error: "Revisá los campos marcados.", fieldErrors: toFieldErrors(result) };
  }

  const imageUrl = await uploadProductImage(formData);

  let productId: string;
  try {
    productId = await db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: { ...toProductData(result.data), imageUrl, priceUpdatedAt: new Date() },
      });

      // Invariante: todo producto nuevo arranca con una fila de stock en
      // cada sucursal existente — la activa recibe lo cargado en el
      // formulario, el resto arranca en 0.
      const branches = await tx.branch.findMany({ select: { id: true } });
      await tx.productStock.createMany({
        data: branches.map((b) => ({
          productId: product.id,
          branchId: b.id,
          stock: b.id === activeBranchId ? result.data.stock : 0,
          minStock: b.id === activeBranchId ? (result.data.minStock ?? null) : null,
        })),
      });

      return product.id;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        error: "Ya existe un producto con ese código de barras / SKU.",
        fieldErrors: { sku: "Este código de barras / SKU ya está en uso" },
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
        error: "Ya existe un producto con ese código de barras / SKU.",
        fieldErrors: { sku: "Este código de barras / SKU ya está en uso" },
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

export type ProductStockActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

// Única forma de corregir el stock de un producto a mano de ahora en más
// (antes era un campo editable del propio producto) — una fila por
// sucursal, ver ProductStockTable.
export async function updateProductStock(
  productId: string,
  branchId: string,
  formData: FormData,
): Promise<ProductStockActionState> {
  await requireAuth();

  const result = productStockSchema.safeParse({
    branchId,
    stock: formData.get("stock"),
    minStock: formData.get("minStock"),
  });
  if (!result.success) {
    return {
      error: "Revisá los valores.",
      fieldErrors: { stock: result.error.issues[0]?.message ?? "Valor inválido" },
    };
  }

  await db.productStock.update({
    where: { productId_branchId: { productId, branchId: result.data.branchId } },
    data: { stock: result.data.stock, minStock: result.data.minStock ?? null },
  });

  revalidatePath(`/products/${productId}`);
  revalidatePath("/products");
  revalidatePath("/");
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

async function checkProductHasHistory(id: string): Promise<{ error?: string }> {
  const [saleCount, purchaseCount] = await Promise.all([
    db.saleItem.count({ where: { productId: id } }),
    db.purchaseOrderItem.count({ where: { productId: id } }),
  ]);
  if (saleCount > 0 || purchaseCount > 0) {
    return {
      error: "Este producto tiene ventas o pedidos asociados. Archivalo en vez de borrarlo.",
    };
  }
  return {};
}

export async function canDeleteProduct(id: string): Promise<{ error?: string }> {
  await requireAuth();
  return checkProductHasHistory(id);
}

export async function deleteProduct(id: string): Promise<{ error?: string }> {
  await requireAuth();

  const check = await checkProductHasHistory(id);
  if (check.error) return check;

  await db.product.delete({ where: { id } });
  revalidatePath("/products");
  return {};
}
