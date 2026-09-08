import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BranchForm } from "./BranchForm";
import { DeleteBranchButton } from "./DeleteBranchButton";

export default async function BranchesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const isAdmin = session.user.role === "admin";

  const branches = await db.branch.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Sucursales</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Cada sucursal tiene su propio stock. Ventas, pedidos y gastos quedan
        asociados a la sucursal activa de la sesión (se elige desde el menú
        lateral).
      </p>

      <div className="mt-6 flex flex-col gap-6">
        {isAdmin && (
          <div>
            <p className="text-sm font-semibold text-ink">Nueva sucursal</p>
            <div className="mt-3">
              <BranchForm />
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-ink">Sucursales cargadas</p>
          {branches.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">
              Todavía no hay sucursales cargadas.
              {!isAdmin && " Pedile a un administrador que cree la primera."}
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {branches.map((branch) => (
                <li
                  key={branch.id}
                  className="flex items-center justify-between rounded-xl border border-line bg-bg p-4"
                >
                  <span className="font-semibold text-ink">{branch.name}</span>
                  {isAdmin && <DeleteBranchButton id={branch.id} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
