import { cookies } from "next/headers";
import { db } from "@/lib/db";

const ACTIVE_BRANCH_COOKIE = "activeBranchId";

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
