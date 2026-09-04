import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { getAllSupplierBalances } from "@/lib/ledger";

export default async function SuppliersPage() {
  const [suppliers, balances] = await Promise.all([
    db.supplier.findMany({ orderBy: { name: "asc" } }),
    getAllSupplierBalances(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Proveedores</h1>
        <Link
          href="/suppliers/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover"
        >
          + Nuevo proveedor
        </Link>
      </div>

      {suppliers.length === 0 ? (
        <p className="mt-6 text-ink-soft">Todavía no hay proveedores cargados.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Saldo cta. cte.</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => {
                const balance = balances.get(s.id) ?? 0;
                return (
                  <tr key={s.id} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {s.phone || s.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          balance > 0 ? "text-err-ink" : balance < 0 ? "text-ok-ink" : "text-ink"
                        }`}
                      >
                        {formatMoney(balance)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/suppliers/${s.id}`}
                        className="font-semibold text-accent hover:underline"
                      >
                        Ver ficha
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
