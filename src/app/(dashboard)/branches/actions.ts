"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { branchSchema } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") {
    return { error: "Solo un administrador puede hacer esto." };
  }
  return null;
}

export type BranchActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createBranch(
  _prev: BranchActionState,
  formData: FormData,
): Promise<BranchActionState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = branchSchema.safeParse({ name: formData.get("name") });
  if (!result.success) {
    return {
      error: "Revisá el nombre.",
      fieldErrors: { name: result.error.issues[0]?.message ?? "Nombre inválido" },
    };
  }

  try {
    await db.$transaction(async (tx) => {
      const branch = await tx.branch.create({ data: { name: result.data.name } });
      // Invariante: toda sucursal nueva arranca con stock 0 de cada
      // producto existente, para que las queries por sucursal no tengan
      // que tratar la ausencia de fila como caso especial.
      const products = await tx.product.findMany({ select: { id: true } });
      if (products.length > 0) {
        await tx.productStock.createMany({
          data: products.map((p) => ({ productId: p.id, branchId: branch.id, stock: 0 })),
        });
      }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        error: "Ya existe una sucursal con ese nombre.",
        fieldErrors: { name: "Este nombre ya está en uso" },
      };
    }
    throw err;
  }

  revalidatePath("/branches");
  revalidatePath("/", "layout");
  return {};
}

export async function canDeleteBranch(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [sales, purchaseOrders, expenses, stockInUse] = await Promise.all([
    db.sale.count({ where: { branchId: id } }),
    db.purchaseOrder.count({ where: { branchId: id } }),
    db.expense.count({ where: { branchId: id } }),
    db.productStock.count({ where: { branchId: id, stock: { gt: 0 } } }),
  ]);
  if (sales > 0 || purchaseOrders > 0 || expenses > 0 || stockInUse > 0) {
    return {
      error:
        "Esta sucursal tiene ventas, pedidos, gastos o stock cargado. No se puede borrar.",
    };
  }
  return {};
}

export async function deleteBranch(id: string): Promise<{ error?: string }> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const check = await canDeleteBranch(id);
  if (check.error) return check;

  await db.$transaction([
    db.productStock.deleteMany({ where: { branchId: id } }),
    db.branch.delete({ where: { id } }),
  ]);

  revalidatePath("/branches");
  revalidatePath("/", "layout");
  return {};
}
