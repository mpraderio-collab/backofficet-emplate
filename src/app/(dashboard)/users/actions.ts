"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { userSchema } from "@/lib/validation";

async function requireAdmin(): Promise<UserActionState | null> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") {
    return { error: "Solo un administrador puede hacer esto." };
  }
  return null;
}

export type UserActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createUser(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Revisá los campos marcados.", fieldErrors };
  }

  const passwordHash = await bcrypt.hash(result.data.password, 12);

  try {
    await db.user.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        passwordHash,
        role: result.data.role,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        error: "Ya existe un usuario con ese email.",
        fieldErrors: { email: "Este email ya está en uso" },
      };
    }
    throw err;
  }

  revalidatePath("/users");
  return {};
}

export async function canDeleteUser(): Promise<{ error?: string }> {
  const denied = await requireAdmin();
  if (denied) return denied;
  const count = await db.user.count();
  if (count <= 1) {
    return { error: "No se puede borrar el único usuario del sistema." };
  }
  return {};
}

export async function deleteUser(id: string): Promise<{ error?: string }> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const count = await db.user.count();
  if (count <= 1) {
    return { error: "No se puede borrar el único usuario del sistema." };
  }

  await db.user.delete({ where: { id } });
  revalidatePath("/users");
  return {};
}
