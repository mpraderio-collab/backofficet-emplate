"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { expenseTypeSchema, expenseSchema } from "@/lib/validation";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user.id;
}

export type ExpenseTypeActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createExpenseType(
  _prev: ExpenseTypeActionState,
  formData: FormData,
): Promise<ExpenseTypeActionState> {
  await requireAuth();

  const result = expenseTypeSchema.safeParse({ name: formData.get("name") });
  if (!result.success) {
    return {
      error: "Revisá el nombre.",
      fieldErrors: { name: result.error.issues[0]?.message ?? "Nombre inválido" },
    };
  }

  try {
    await db.expenseType.create({ data: { name: result.data.name } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        error: "Ya existe un tipo de gasto con ese nombre.",
        fieldErrors: { name: "Este nombre ya está en uso" },
      };
    }
    throw err;
  }

  revalidatePath("/expenses");
  return {};
}

export async function deleteExpenseType(id: string): Promise<{ error?: string }> {
  await requireAuth();

  const count = await db.expense.count({ where: { expenseTypeId: id } });
  if (count > 0) {
    return { error: "Este tipo de gasto tiene gastos cargados. No se puede borrar." };
  }

  await db.expenseType.delete({ where: { id } });
  revalidatePath("/expenses");
  return {};
}

export type ExpenseActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function parseExpenseForm(formData: FormData) {
  return expenseSchema.safeParse({
    expenseTypeId: formData.get("expenseTypeId"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    referenceMonth: formData.get("referenceMonth"),
    paymentMethod: formData.get("paymentMethod"),
    isRecurring: formData.get("isRecurring"),
    note: formData.get("note"),
  });
}

export async function createExpense(
  _prev: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const userId = await requireAuth();

  const result = parseExpenseForm(formData);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Revisá los campos marcados.", fieldErrors };
  }

  await db.expense.create({
    data: {
      expenseTypeId: result.data.expenseTypeId,
      amount: result.data.amount,
      date: result.data.date,
      referenceMonth: result.data.referenceMonth,
      paymentMethod: result.data.paymentMethod,
      isRecurring: result.data.isRecurring,
      note: result.data.note || null,
      createdByUserId: userId,
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/");
  return {};
}

export async function deleteExpense(id: string): Promise<{ error?: string }> {
  await requireAuth();

  await db.expense.delete({ where: { id } });
  revalidatePath("/expenses");
  revalidatePath("/");
  return {};
}
