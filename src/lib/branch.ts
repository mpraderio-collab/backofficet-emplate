import { cookies } from "next/headers";
import { db } from "@/lib/db";

const ACTIVE_BRANCH_COOKIE = "activeBranchId";
// Marca temporal: se setea al loguearse y dispara el popup de "a qué
// sucursal entrás" en el layout — se borra apenas el usuario responde
// (elige sucursal o lo cierra), así que solo aparece una vez por login.
const JUST_LOGGED_IN_COOKIE = "justLoggedIn";

// La sucursal activa es una elección de sesión (cookie), no del usuario ni
// de la cuenta — la misma persona puede pararse en distintas sucursales en
// distintos momentos. No se guarda en el JWT de NextAuth para no requerir
// re-login al cambiarla.
export async function getActiveBranch() {
  const branches = await db.branch.findMany({ orderBy: { createdAt: "asc" } });
  const store = await cookies();
  const id = store.get(ACTIVE_BRANCH_COOKIE)?.value;
  const active = branches.find((b) => b.id === id) ?? branches[0] ?? null;
  return { active, branches };
}

export async function getActiveBranchId(): Promise<string | null> {
  const { active } = await getActiveBranch();
  return active?.id ?? null;
}

export async function setActiveBranchCookie(branchId: string) {
  const branch = await db.branch.findUnique({ where: { id: branchId } });
  if (!branch) return;
  const store = await cookies();
  store.set(ACTIVE_BRANCH_COOKIE, branchId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

// Se llama desde la acción de login, antes de signIn(). Duración corta:
// si el popup no llega a mostrarse (o el usuario no responde) por algún
// motivo, no queda colgado para siempre.
export async function markJustLoggedIn() {
  const store = await cookies();
  store.set(JUST_LOGGED_IN_COOKIE, "1", { path: "/", maxAge: 60 * 5, sameSite: "lax" });
}

// Solo lectura — se puede llamar desde un Server Component (el layout).
export async function wasJustLoggedIn(): Promise<boolean> {
  const store = await cookies();
  return store.get(JUST_LOGGED_IN_COOKIE)?.value === "1";
}

// Requiere contexto de Server Action / Route Handler (no funciona en un
// Server Component en render).
export async function clearJustLoggedInFlag() {
  const store = await cookies();
  store.delete(JUST_LOGGED_IN_COOKIE);
}
