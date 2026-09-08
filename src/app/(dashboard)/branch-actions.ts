"use server";

import { revalidatePath } from "next/cache";
import { setActiveBranchCookie } from "@/lib/branch";

export async function switchBranch(formData: FormData) {
  const branchId = formData.get("branchId");
  if (typeof branchId !== "string" || !branchId) return;
  await setActiveBranchCookie(branchId);
  // Revalida todo el árbol del layout: casi cada página depende de la
  // sucursal activa (stock, ventas, gastos, pedidos, panel principal).
  revalidatePath("/", "layout");
}
