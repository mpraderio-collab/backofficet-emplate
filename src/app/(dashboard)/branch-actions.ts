"use server";

import { revalidatePath } from "next/cache";
import { setActiveBranchCookie, clearJustLoggedInFlag } from "@/lib/branch";

export async function switchBranch(formData: FormData) {
  const branchId = formData.get("branchId");
  if (typeof branchId !== "string" || !branchId) return;
  await setActiveBranchCookie(branchId);
  // Revalida todo el árbol del layout: casi cada página depende de la
  // sucursal activa (stock, ventas, gastos, pedidos, panel principal).
  revalidatePath("/", "layout");
}

// Responder el popup de "a qué sucursal entrás" (ver JUST_LOGGED_IN_COOKIE
// en lib/branch.ts) — elegir una sucursal lo confirma y lo cierra a la vez.
export async function confirmBranchFromPrompt(formData: FormData) {
  const branchId = formData.get("branchId");
  if (typeof branchId === "string" && branchId) {
    await setActiveBranchCookie(branchId);
  }
  await clearJustLoggedInFlag();
  revalidatePath("/", "layout");
}

// Cerrar el popup sin elegir — se queda con la sucursal que ya estaba activa.
export async function dismissBranchPrompt() {
  await clearJustLoggedInFlag();
  revalidatePath("/", "layout");
}
