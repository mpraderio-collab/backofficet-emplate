"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { supplierSchema, ledgerPaymentSchema } from "@/lib/validation";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
}

export type SupplierActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function parseForm(formData: FormData) {
  return supplierSchema.safeParse({
    name: formData.get("name"),
    taxId: formData.get("taxId"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    city: formData.get("city"),
  });
}

function toFieldErrors(result: ReturnType<typeof parseForm>) {
  if (result.success) return {};
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function createSupplier(
  _prev: SupplierActionState,
  formData: FormData,
): Promise<SupplierActionState> {
  await requireAuth();

  const result = parseForm(formData);
  if (!result.success) {
    return { error: "Revisá los campos marcados.", fieldErrors: toFieldErrors(result) };
  }

  const supplier = await db.supplier.create({ data: result.data });
  revalidatePath("/suppliers");
  redirect(`/suppliers/${supplier.id}`);
}

export async function updateSupplier(
  id: string,
  _prev: SupplierActionState,
  formData: FormData,
): Promise<SupplierActionState> {
  await requireAuth();

  const result = parseForm(formData);
  if (!result.success) {
    return { error: "Revisá los campos marcados.", fieldErrors: toFieldErrors(result) };
  }

  await db.supplier.update({ where: { id }, data: result.data });
  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${id}`);
  return {};
}

export type PaymentActionState = { error?: string };

export async function registerSupplierPayment(
  supplierId: string,
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  await requireAuth();

  const result = ledgerPaymentSchema.safeParse({
    amount: formData.get("amount"),
    note: formData.get("note"),
  });
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Revisá el monto." };
  }

  await db.supplierLedgerEntry.create({
    data: {
      supplierId,
      type: "payment",
      amount: result.data.amount,
      note: result.data.note || null,
    },
  });

  revalidatePath(`/suppliers/${supplierId}`);
  revalidatePath("/suppliers");
  return {};
}
