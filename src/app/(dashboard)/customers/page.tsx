import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { getAllCustomerBalances } from "@/lib/ledger";

export default async function CustomersPage() {
  const [customers, balances] = await Promise.all([
    db.customer.findMany({ orderBy: { name: "asc" } }),
    getAllCustomerBalances(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Clientes</h1>
        <Link
          href="/customers/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover"
        >
          + Nuevo cliente
        </Link>
      </div>

      {customers.length === 0 ? (
        <p className="mt-6 text-ink-soft">Todavía no hay clientes cargados.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Saldo cta. cte.</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const balance = balances.get(c.id) ?? 0;
                return (
                  <tr key={c.id} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {c.phone || c.email || "—"}
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
                        href={`/customers/${c.id}`}
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
