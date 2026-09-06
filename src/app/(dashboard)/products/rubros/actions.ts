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
