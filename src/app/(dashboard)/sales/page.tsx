import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";

export default async function SalesPage() {
  const sales = await db.sale.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { name: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Ventas</h1>
        <Link
          href="/sales/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover"
        >
          + Nueva venta
        </Link>
      </div>

      {sales.length === 0 ? (
        <p className="mt-6 text-ink-soft">Todavía no hay ventas registradas.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3 text-ink-soft">{formatDate(sale.createdAt)}</td>
                  <td className="px-4 py-3 font-medium text-ink">{sale.customer.name}</td>
                  <td className="px-4 py-3 text-ink">{formatMoney(sale.total)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                        sale.status === "confirmed"
                          ? "bg-ok-bg text-ok-ink"
                          : "bg-line-soft text-ink-faint"
                      }`}
                    >
                      {sale.status === "confirmed" ? "Confirmada" : "Cancelada"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/sales/${sale.id}`}
                      className="font-semibold text-accent hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
