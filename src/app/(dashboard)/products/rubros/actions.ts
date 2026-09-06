"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rubroSchema, subrubroSchema } from "@/lib/validation";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
}

export type RubroActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createRubro(
  _prev: RubroActionState,
  formData: FormData,
): Promise<RubroActionState> {
  await requireAuth();

  const result = rubroSchema.safeParse({ name: formData.get("name") });
  if (!result.success) {
    return {
      error: "Revisá el nombre.",
      fieldErrors: { name: result.error.issues[0]?.message ?? "Nombre inválido" },
    };
  }

  try {
    await db.rubro.create({ data: { name: result.data.name } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        error: "Ya existe un rubro con ese nombre.",
        fieldErrors: { name: "Este nombre ya está en uso" },
      };
    }
    throw err;
  }

  revalidatePath("/products/rubros");
  revalidatePath("/products");
  return {};
}

export type CreateRubroInlineResult = { id: string; name: string } | { error: string };

// Versión liviana de createRubro para crear un rubro sin salir del
// formulario de producto — devuelve el registro creado en vez de un
// ActionState, para poder seleccionarlo al toque en el combo.
export async function createRubroInline(name: string): Promise<CreateRubroInlineResult> {
  await requireAuth();

  const result = rubroSchema.safeParse({ name });
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Nombre inválido" };
  }

  try {
    const rubro = await db.rubro.create({ data: { name: result.data.name } });
    revalidatePath("/products/rubros");
    revalidatePath("/products");
    return { id: rubro.id, name: rubro.name };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ya existe un rubro con ese nombre." };
    }
    throw err;
  }
}

export async function deleteRubro(id: string): Promise<{ error?: string }> {
  await requireAuth();

  const count = await db.subrubro.count({ where: { rubroId: id } });
  if (count > 0) {
    return { error: "Este rubro tiene subrubros cargados. Borralos primero." };
  }

  await db.rubro.delete({ where: { id } });
  revalidatePath("/products/rubros");
  revalidatePath("/products");
  return {};
}

export type SubrubroActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createSubrubro(
  _prev: SubrubroActionState,
  formData: FormData,
): Promise<SubrubroActionState> {
  await requireAuth();

  const result = subrubroSchema.safeParse({
    name: formData.get("name"),
    rubroId: formData.get("rubroId"),
  });
  if (!result.success) {
    return {
      error: "Revisá los campos.",
      fieldErrors: { name: result.error.issues[0]?.message ?? "Datos inválidos" },
    };
  }

  try {
    await db.subrubro.create({
      data: { name: result.data.name, rubroId: result.data.rubroId },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        error: "Ya existe un subrubro con ese nombre en este rubro.",
        fieldErrors: { name: "Este nombre ya está en uso en este rubro" },
      };
    }
    throw err;
  }

  revalidatePath("/products/rubros");
  revalidatePath("/products");
  return {};
}

export type CreateSubrubroInlineResult = { id: string; name: string } | { error: string };

// Versión liviana de createSubrubro para crear un subrubro sin salir del
// formulario de producto.
export async function createSubrubroInline(
  rubroId: string,
  name: string,
): Promise<CreateSubrubroInlineResult> {
  await requireAuth();

  const result = subrubroSchema.safeParse({ name, rubroId });
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    const subrubro = await db.subrubro.create({
      data: { name: result.data.name, rubroId: result.data.rubroId },
    });
    revalidatePath("/products/rubros");
    revalidatePath("/products");
    return { id: subrubro.id, name: subrubro.name };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ya existe un subrubro con ese nombre en este rubro." };
    }
    throw err;
  }
}

export async function deleteSubrubro(id: string): Promise<{ error?: string }> {
  await requireAuth();

  const count = await db.product.count({ where: { subrubroId: id } });
  if (count > 0) {
    return { error: "Este subrubro tiene productos cargados. No se puede borrar." };
  }

  await db.subrubro.delete({ where: { id } });
  revalidatePath("/products/rubros");
  revalidatePath("/products");
  return {};
}
