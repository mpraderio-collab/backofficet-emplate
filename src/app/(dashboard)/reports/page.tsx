import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatMoney, formatQuantity } from "@/lib/format";
import {
  endOfToday,
  oneYearAgo,
  startOfMonth,
  startOfToday,
  startOfYear,
  toDateInputValue,
} from "@/lib/reports";
import { getLastSaleDatesByProduct } from "@/lib/product-sales";

export default async function ReportsPage(props: PageProps<"/reports">) {
  const searchParams = await props.searchParams;
  const fromParam = typeof searchParams?.from === "string" ? searchParams.from : undefined;
  const toParam = typeof searchParams?.to === "string" ? searchParams.to : undefined;

  const from = fromParam ? new Date(`${fromParam}T00:00:00`) : startOfMonth();
  const to = toParam ? new Date(`${toParam}T23:59:59`) : endOfToday();

  const sales = await db.sale.findMany({
    where: { status: "confirmed", createdAt: { gte: from, lte: to } },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true } },
      items: { include: { product: { select: { name: true, fractionUnit: true } } } },
    },
  });

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const saleCount = sales.length;
  const avgTicket = saleCount > 0 ? totalRevenue / saleCount : 0;

  const byProduct = new Map<
    string,
    { name: string; unitCount: number; fractionQuantity: number; fractionUnit: string | null; total: number }
  >();
  for (const sale of sales) {
    for (const item of sale.items) {
      const entry = byProduct.get(item.productId) ?? {
        name: item.product.name,
        unitCount: 0,
        fractionQuantity: 0,
        fractionUnit: item.product.fractionUnit,
        total: 0,
      };
      if (item.saleUnit === "fraction") entry.fractionQuantity += item.quantity;
      else entry.unitCount += item.quantity;
      entry.total += item.unitPrice * item.quantity;
      byProduct.set(item.productId, entry);
    }
  }
  const productBreakdown = [...byProduct.values()].sort((a, b) => b.total - a.total);

  // "Productos parados": independiente del filtro de fecha de arriba —
  // siempre mira todo el historial, no el rango elegido.
  const [activeProducts, lastSaleByProduct] = await Promise.all([
    db.product.findMany({
      where: { status: "active" },
      select: { id: true, name: true, stock: true, fractionUnit: true },
    }),
    getLastSaleDatesByProduct(),
  ]);
  const staleThreshold = oneYearAgo();
  const staleProducts = activeProducts
    .map((p) => ({ ...p, lastSaleDate: lastSaleByProduct.get(p.id) ?? null }))
    .filter((p) => !p.lastSaleDate || p.lastSaleDate < staleThreshold)
    .sort((a, b) => {
      if (!a.lastSaleDate && !b.lastSaleDate) return a.name.localeCompare(b.name);
      if (!a.lastSaleDate) return -1;
      if (!b.lastSaleDate) return 1;
      return a.lastSaleDate.getTime() - b.lastSaleDate.getTime();
    });

  const quickRanges = [
    { label: "Hoy", from: startOfToday(), to: endOfToday() },
    { label: "Este mes", from: startOfMonth(), to: endOfToday() },
    { label: "Este año", from: startOfYear(), to: endOfToday() },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Informes de ventas</h1>

      <div className="mt-6 flex flex-wrap items-end gap-4 rounded-xl border border-line bg-surface p-4">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Desde</span>
            <input
              type="date"
              name="from"
              defaultValue={toDateInputValue(from)}
              className="input"
            />
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
          {quickRanges.map((r) => (
            <Link
              key={r.label}
              href={`/reports?from=${toDateInputValue(r.from)}&to=${toDateInputValue(r.to)}`}
              className="rounded-lg border border-border-input bg-bg px-3 py-2 text-xs font-semibold text-ink hover:bg-surface"
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-bg p-[18px]">
          <p className="text-[13px] text-ink-soft">Total vendido</p>
          <p className="mt-1 text-2xl font-bold text-ink">{formatMoney(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-line bg-bg p-[18px]">
          <p className="text-[13px] text-ink-soft">Ventas</p>
          <p className="mt-1 text-2xl font-bold text-ink">{saleCount}</p>
        </div>
        <div className="rounded-xl border border-line bg-bg p-[18px]">
          <p className="text-[13px] text-ink-soft">Ticket promedio</p>
          <p className="mt-1 text-2xl font-bold text-ink">{formatMoney(avgTicket)}</p>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold text-ink">Ventas por producto</p>
        {productBreakdown.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No hay ventas en este período.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-bg">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Total facturado</th>
                </tr>
              </thead>
              <tbody>
                {productBreakdown.map((p) => (
                  <tr key={p.name} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 text-ink">{p.name}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {p.unitCount > 0 && `${p.unitCount} u.`}
                      {p.unitCount > 0 && p.fractionQuantity > 0 && " + "}
                      {p.fractionQuantity > 0 && formatQuantity(p.fractionQuantity, p.fractionUnit)}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{formatMoney(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold text-ink">Detalle de ventas</p>
        {sales.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No hay ventas en este período.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-bg">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Ítems</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 text-ink-soft">{formatDate(sale.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-ink">{sale.customer.name}</td>
                    <td className="px-4 py-3 text-ink-soft">{sale.items.length}</td>
                    <td className="px-4 py-3 text-ink">{formatMoney(sale.total)}</td>
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

      <div className="mt-8">
        <p className="text-sm font-semibold text-ink">Productos parados</p>
        <p className="text-xs text-ink-faint">
          Productos activos sin ventas en el último año (o que nunca se vendieron) — sin importar
          el rango de fechas elegido arriba.
        </p>
        {staleProducts.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">
            No hay productos parados: todos tuvieron ventas en el último año.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-bg">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Última venta</th>
                  <th className="px-4 py-3">Stock actual</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {staleProducts.map((p) => (
                  <tr key={p.id} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 text-ink">{p.name}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {p.lastSaleDate ? formatDate(p.lastSaleDate) : "Nunca se vendió"}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {formatQuantity(p.stock, p.fractionUnit)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/products/${p.id}`}
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
    </div>
  );
}
