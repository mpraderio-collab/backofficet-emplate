import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { UserForm } from "./UserForm";
import { DeleteUserButton } from "./DeleteUserButton";

export default async function UsersPage() {
  const [session, users] = await Promise.all([
    auth(),
    db.user.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Usuarios</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Todos los usuarios tienen el mismo acceso al sistema.
      </p>

      <div className="mt-6 max-w-2xl">
        <UserForm />
      </div>

      <div className="mt-6 max-w-2xl overflow-x-auto rounded-xl border border-line bg-bg">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Alta</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line-soft last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                <td className="px-4 py-3 text-ink-soft">{u.email}</td>
                <td className="px-4 py-3 text-ink-soft">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  {u.email !== session?.user?.email && <DeleteUserButton id={u.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
