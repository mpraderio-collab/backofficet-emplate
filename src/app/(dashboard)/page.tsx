import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney, formatQuantity } from "@/lib/format";
import { getAllCustomerBalances, getAllSupplierBalances } from "@/lib/ledger";
import { purchaseOrderStatusColors, purchaseOrderStatusLabels } from "@/lib/purchase-order-status";
import { monthBuckets, startOfMonth, endOfToday } from "@/lib/reports";
import { estimateItemCost } from "@/lib/margin";
import { effectiveMinStock, isLowStock } from "@/lib/stock";
import { BarChart } from "@/components/charts/BarChart";
import { DonutChart } from "@/components/charts/DonutChart";

export default async function DashboardPage() {
  const buckets = monthBuckets(6);
  const rangeStart = buckets[0].start;

  const [
    productCount,
    activeProducts,
    pendingPurchaseOrders,
    customerBalances,
    supplierBalances,
    recentSales,
    salesForCharts,
    salesThisMonth,
  ] = await Promise.all([
    db.product.count({ where: { status: "active" } }),
    db.product.findMany({
      where: { status: "active" },
      select: { id: true, name: true, stock: true, fractionUnit: true, minStock: true },
    }),
    db.purchaseOrder.findMany({
      where: { status: { in: ["pending", "sent"] } },
      include: { supplier: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),
    getAllCustomerBalances(),
    getAllSupplierBalances(),
    db.sale.findMany({
      where: { status: "confirmed" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { customer: { select: { name: true } } },
    }),
    db.sale.findMany({
      where: { status: "confirmed", createdAt: { gte: rangeStart } },
      select: {
        total: true,
        createdAt: true,
        items: {
          select: {
            unitPrice: true,
            quantity: true,
            saleUnit: true,
            product: { select: { name: true, cost: true, unitSize: true } },
          },
        },
      },
    }),
    db.sale.findMany({
      where: { status: "confirmed", createdAt: { gte: startOfMonth(), lte: endOfToday() } },
      select: { total: true },
    }),
  ]);

  const lowStockProducts = activeProducts
    .filter((p) => isLowStock(p.stock, p.minStock))
    .sort((a, b) => a.stock - effectiveMinStock(a.minStock) - (b.stock - effectiveMinStock(b.minStock)))
    .slice(0, 6);

  const totalReceivable = [...customerBalances.values()].reduce(
    (sum, b) => sum + Math.max(b, 0),
    0,
  );
  const totalPayable = [...supplierBalances.values()].reduce(
    (sum, b) => sum + Math.max(b, 0),
    0,
  );

  const revenueThisMonth = salesThisMonth.reduce((sum, s) => sum + s.total, 0);

  // Margen = ingreso - costo estimado, sumado solo sobre las líneas que
  // tienen costo cargado (y, si son por fracción, unitSize) — las que no,
  // quedan afuera tanto del monto como del ingreso de referencia del %,
  // para no inflar ni diluir el margen con datos incompletos.
  let totalMarginAmount = 0;
  let totalMarginRevenue = 0;
  const marginByBucket = buckets.map(() => 0);
  for (const sale of salesForCharts) {
    const bucketIndex = buckets.findIndex(
      (b) => sale.createdAt >= b.start && sale.createdAt < b.end,
    );
    for (const item of sale.items) {
      const itemCost = estimateItemCost(
        item.saleUnit,
        item.quantity,
        item.product.cost,
        item.product.unitSize,
      );
      if (itemCost == null) continue;
      const itemRevenue = item.unitPrice * item.quantity;
      const itemMargin = itemRevenue - itemCost;
      totalMarginAmount += itemMargin;
      totalMarginRevenue += itemRevenue;
      if (bucketIndex >= 0) marginByBucket[bucketIndex] += itemMargin;
    }
  }
  const totalMarginPercent =
    totalMarginRevenue > 0 ? (totalMarginAmount / totalMarginRevenue) * 100 : 0;

  const stats = [
    { label: "Productos activos", value: productCount },
    { label: "Facturado este mes", value: formatMoney(revenueThisMonth) },
    {
      label: "Margen total de ventas",
      value: formatMoney(totalMarginAmount),
      hint: `${totalMarginPercent.toFixed(1)}% · últimos ${buckets.length} meses`,
    },
    { label: "Por cobrar a clientes", value: formatMoney(totalReceivable) },
    { label: "Por pagar a proveedores", value: formatMoney(totalPayable) },
  ];

  const monthlyRevenue = buckets.map((bucket) => {
    const total = salesForCharts
      .filter((s) => s.createdAt >= bucket.start && s.createdAt < bucket.end)
      .reduce((sum, s) => sum + s.total, 0);
    return { label: bucket.label, value: total };
  });

  const monthlyMargin = buckets.map((bucket, i) => ({
    label: bucket.label,
    value: marginByBucket[i],
  }));

  const revenueByProduct = new Map<string, number>();
  for (const sale of salesForCharts) {
    for (const item of sale.items) {
      const current = revenueByProduct.get(item.product.name) ?? 0;
      revenueByProduct.set(item.product.name, current + item.unitPrice * item.quantity);
    }
  }
  const topProducts = [...revenueByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-ink">Panorama del negocio</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Un vistazo general a ventas, stock y cuentas corrientes.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-bg p-[18px]">
            <p className="text-[13px] text-ink-soft">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{stat.value}</p>
            {stat.hint && <p className="mt-0.5 text-xs text-ink-faint">{stat.hint}</p>}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-line bg-bg p-5">
          <p className="text-sm font-semibold text-ink">Ventas por mes</p>
          <p className="text-xs text-ink-faint">Últimos {buckets.length} meses, facturación total</p>
          <div className="mt-4">
            <BarChart data={monthlyRevenue} formatValue={(v) => formatMoney(v)} />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-bg p-5">
          <p className="text-sm font-semibold text-ink">Margen por mes</p>
          <p className="text-xs text-ink-faint">Últimos {buckets.length} meses, margen estimado</p>
          <div className="mt-4">
            <BarChart data={monthlyMargin} formatValue={(v) => formatMoney(v)} />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-bg p-5">
          <p className="text-sm font-semibold text-ink">Productos más vendidos</p>
          <p className="text-xs text-ink-faint">Por facturación, últimos {buckets.length} meses</p>
          <div className="mt-4">
            <DonutChart data={topProducts} formatValue={(v) => formatMoney(v)} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-bg p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Stock bajo</p>
            <Link href="/products" className="text-sm font-semibold text-accent hover:underline">
              Ver todos →
            </Link>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">Todos los productos tienen stock suficiente.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">{p.name}</span>
                  <span
                    className={p.stock === 0 ? "font-semibold text-err-ink" : "font-semibold text-warn-ink"}
                  >
                    {p.stock === 0 ? "sin stock" : formatQuantity(p.stock, p.fractionUnit)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-line bg-bg p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Pedidos a proveedores en curso</p>
            <Link href="/purchase-orders" className="text-sm font-semibold text-accent hover:underline">
              Ver todos →
            </Link>
          </div>
          {pendingPurchaseOrders.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">No hay pedidos pendientes.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {pendingPurchaseOrders.map((po) => (
                <li key={po.id} className="flex items-center justify-between text-sm">
                  <Link href={`/purchase-orders/${po.id}`} className="text-ink-soft hover:text-accent">
                    {po.supplier.name}
                  </Link>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${purchaseOrderStatusColors[po.status]}`}
                  >
                    {purchaseOrderStatusLabels[po.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">Últimas ventas</p>
          <Link href="/sales" className="text-sm font-semibold text-accent hover:underline">
            Ver todas →
          </Link>
        </div>
        {recentSales.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">Todavía no hay ventas.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-bg">
            <table className="w-full min-w-[420px] text-left text-sm">
              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{sale.customer.name}</td>
                    <td className="px-4 py-3 text-ink-soft">{formatMoney(sale.total)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/sales/${sale.id}`} className="font-semibold text-accent hover:underline">
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
