import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { getAllCustomerBalances } from "@/lib/ledger";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { ClickableRow } from "@/components/ClickableRow";

export default async function CustomersPage(props: PageProps<"/customers">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams?.q === "string" ? searchParams.q : "";

  const [customers, balances] = await Promise.all([
    db.customer.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
      orderBy: { name: "asc" },
    }),
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

      <form className="mt-6 flex items-end gap-3" method="get">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Buscar por nombre</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Ej: Carlos"
            className="input w-64"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Buscar
        </button>
        {q && (
          <Link
            href="/customers"
            className="rounded-lg border border-border-input bg-bg px-3 py-2 text-xs font-semibold text-ink hover:bg-surface"
          >
            Limpiar
          </Link>
        )}
      </form>

      {customers.length === 0 ? (
        <p className="mt-6 text-ink-soft">
          {q ? "Ningún cliente coincide con esta búsqueda." : "Todavía no hay clientes cargados."}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Saldo cta. cte.</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const balance = balances.get(c.id) ?? 0;
                return (
                  <ClickableRow
                    key={c.id}
                    href={`/customers/${c.id}`}
                    className="border-b border-line-soft last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      <span className="inline-flex items-center gap-1.5">
                        {c.phone || c.email || "—"}
                        {c.phone && (
                          <WhatsAppLink
                            phone={c.phone}
                            message={`Hola ${c.name}! Te escribo de parte del negocio.`}
                          />
                        )}
                      </span>
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
                  </ClickableRow>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
