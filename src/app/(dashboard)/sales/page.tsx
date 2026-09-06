import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import {
  endOfToday,
  startOfMonth,
  startOfToday,
  startOfYear,
  toDateInputValue,
} from "@/lib/reports";
import { ClickableRow } from "@/components/ClickableRow";

export default async function SalesPage(props: PageProps<"/sales">) {
  const searchParams = await props.searchParams;
  const fromParam = typeof searchParams?.from === "string" ? searchParams.from : undefined;
  const toParam = typeof searchParams?.to === "string" ? searchParams.to : undefined;

  const from = fromParam ? new Date(`${fromParam}T00:00:00`) : startOfMonth();
  const to = toParam ? new Date(`${toParam}T23:59:59`) : endOfToday();
  const hasFilters = Boolean(fromParam || toParam);

  const sales = await db.sale.findMany({
    where: { createdAt: { gte: from, lte: to } },
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { name: true } } },
  });

  const quickRanges = [
    { label: "Hoy", from: startOfToday(), to: endOfToday() },
    { label: "Este mes", from: startOfMonth(), to: endOfToday() },
    { label: "Este año", from: startOfYear(), to: endOfToday() },
  ];
  const activeRangeLabel = quickRanges.find(
    (r) => toDateInputValue(r.from) === toDateInputValue(from) && toDateInputValue(r.to) === toDateInputValue(to),
  )?.label;

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

      <div className="mt-6 flex flex-wrap items-end gap-4 rounded-xl border border-line bg-surface p-4">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Desde</span>
            <input type="date" name="from" defaultValue={toDateInputValue(from)} className="input" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Hasta</span>
            <input type="date" name="to" defaultValue={toDateInputValue(to)} className="input" />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Filtrar
          </button>
        </form>
        <div className="flex gap-2">
          {quickRanges.map((r) => {
            const isActive = r.label === activeRangeLabel;
            return (
              <Link
                key={r.label}
                href={`/sales?from=${toDateInputValue(r.from)}&to=${toDateInputValue(r.to)}`}
                className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
                  isActive
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border-input bg-bg text-ink hover:bg-surface"
                }`}
              >
                {isActive && "✓ "}
                {r.label}
              </Link>
            );
          })}
          {hasFilters && (
            <Link
              href="/sales"
              className="rounded-lg border border-border-input bg-bg px-3 py-2 text-xs font-semibold text-ink hover:bg-surface"
            >
              Limpiar filtros
            </Link>
          )}
        </div>
      </div>

      {sales.length === 0 ? (
        <p className="mt-6 text-ink-soft">
          {hasFilters
            ? "Ninguna venta coincide con este período."
            : "Todavía no hay ventas registradas."}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <ClickableRow
                  key={sale.id}
                  href={`/sales/${sale.id}`}
                  className="border-b border-line-soft last:border-0"
                >
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
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
