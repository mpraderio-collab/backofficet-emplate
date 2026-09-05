import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { getAllSupplierBalances } from "@/lib/ledger";
import { WhatsAppLink } from "@/components/WhatsAppLink";

export default async function SuppliersPage(props: PageProps<"/suppliers">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams?.q === "string" ? searchParams.q : "";

  const [suppliers, balances] = await Promise.all([
    db.supplier.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
      orderBy: { name: "asc" },
    }),
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

      <form className="mt-6 flex items-end gap-3" method="get">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Buscar por nombre</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Ej: Distribuidora"
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
            href="/suppliers"
            className="rounded-lg border border-border-input bg-bg px-3 py-2 text-xs font-semibold text-ink hover:bg-surface"
          >
            Limpiar
          </Link>
        )}
      </form>

      {suppliers.length === 0 ? (
        <p className="mt-6 text-ink-soft">
          {q
            ? "Ningún proveedor coincide con esta búsqueda."
            : "Todavía no hay proveedores cargados."}
        </p>
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
                      <span className="inline-flex items-center gap-1.5">
                        {s.phone || s.email || "—"}
                        {s.phone && (
                          <WhatsAppLink
                            phone={s.phone}
                            message={`Hola ${s.name}! Te escribo de parte del negocio.`}
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
