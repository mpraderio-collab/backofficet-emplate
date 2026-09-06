import Link from "next/link";
import { db } from "@/lib/db";
import { formatDateOnly, formatMoney, formatQuantity } from "@/lib/format";
import { getExpenseStatus, expenseStatusLabels, expenseStatusColors } from "@/lib/expense-status";
import { MarkExpensePaidButton } from "./expenses/MarkExpensePaidButton";
import { getAllCustomerBalances, getAllSupplierBalances } from "@/lib/ledger";
import { purchaseOrderStatusColors, purchaseOrderStatusLabels } from "@/lib/purchase-order-status";
import { monthBuckets, startOfMonth, endOfMonth, startOfTodayUTC, endOfToday, daysSince } from "@/lib/reports";
import { estimateItemCost } from "@/lib/margin";
import { effectiveMinStock, isLowStock } from "@/lib/stock";
import { BarChart } from "@/components/charts/BarChart";
import { DonutChart } from "@/components/charts/DonutChart";

export default async function DashboardPage() {
  const buckets = monthBuckets(6);
  const rangeStart = buckets[0].start;

  const monthStart = startOfMonth();
  const monthEnd = endOfToday();

  const [
    productCount,
    activeProducts,
    pendingPurchaseOrders,
    customerBalances,
    supplierBalances,
    salesForCharts,
    expensesThisMonth,
    unpaidExpensesDueThisMonth,
  ] = await Promise.all([
    db.product.count({ where: { status: "active" } }),
    db.product.findMany({
      where: { status: "active" },
      select: { id: true, name: true, stock: true, fractionUnit: true, minStock: true },
    }),
    db.purchaseOrder.findMany({
      where: { status: { in: ["pending", "sent"] } },
      include: {
        supplier: { select: { name: true } },
        statusEvents: { where: { status: "sent" }, orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),
    getAllCustomerBalances(),
    getAllSupplierBalances(),
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
    db.expense.findMany({
      where: { dueDate: { gte: monthStart, lte: monthEnd } },
      select: { amount: true },
    }),
    db.expense.findMany({
      where: { dueDate: { gte: monthStart, lte: endOfMonth() }, paidDate: null },
      orderBy: { dueDate: "asc" },
      include: { expenseType: { select: { name: true } } },
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

  // Margen = ingreso - costo estimado, sumado solo sobre las líneas que
  // tienen costo cargado (y, si son por fracción, unitSize) — las que no,
  // quedan afuera tanto del monto como del ingreso de referencia del %,
  // para no inflar ni diluir el margen con datos incompletos.
  let revenueThisMonth = 0;
  let marginThisMonth = 0;
  let marginRevenueThisMonth = 0;
  const marginByBucket = buckets.map(() => 0);
  for (const sale of salesForCharts) {
    const bucketIndex = buckets.findIndex(
      (b) => sale.createdAt >= b.start && sale.createdAt < b.end,
    );
    const isThisMonth = sale.createdAt >= monthStart && sale.createdAt <= monthEnd;
    if (isThisMonth) revenueThisMonth += sale.total;
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
      if (bucketIndex >= 0) marginByBucket[bucketIndex] += itemMargin;
      if (isThisMonth) {
        marginThisMonth += itemMargin;
        marginRevenueThisMonth += itemRevenue;
      }
    }
  }
  const marginPercentThisMonth =
    marginRevenueThisMonth > 0 ? (marginThisMonth / marginRevenueThisMonth) * 100 : 0;

  const totalExpensesThisMonth = expensesThisMonth.reduce((sum, e) => sum + e.amount, 0);
  // Ganancia neta = margen (ingreso - costo de productos) menos los gastos
  // del negocio del mes — a propósito separada de "Margen total de ventas"
  // para no mezclar el margen bruto con los gastos.
  const netProfitThisMonth = marginThisMonth - totalExpensesThisMonth;

  // "in" = entrada de dinero (o a favor nuestro), "out" = salida de dinero
  // (o compromiso pendiente), "neutral" = no es un monto de dinero.
  const stats: { label: string; value: string | number; hint?: string; tone: "in" | "out" | "neutral" }[] = [
    { label: "Productos activos", value: productCount, tone: "neutral" },
    { label: "Facturado este mes", value: formatMoney(revenueThisMonth), tone: "in" },
    {
      label: "Margen total de ventas",
      value: formatMoney(marginThisMonth),
      hint: `${marginPercentThisMonth.toFixed(1)}% · este mes`,
      tone: "in",
    },
    { label: "Gastos del mes", value: formatMoney(totalExpensesThisMonth), tone: "out" },
    {
      label: "Ganancia neta del mes",
      value: formatMoney(netProfitThisMonth),
      hint: `Margen ${formatMoney(marginThisMonth)} − gastos ${formatMoney(totalExpensesThisMonth)}`,
      tone: netProfitThisMonth >= 0 ? "in" : "out",
    },
    { label: "Por cobrar a clientes", value: formatMoney(totalReceivable), tone: "in" },
    { label: "Por pagar a proveedores", value: formatMoney(totalPayable), tone: "out" },
  ];

  const statToneClass: Record<"in" | "out" | "neutral", string> = {
    in: "text-ok-ink",
    out: "text-err-ink",
    neutral: "text-ink",
  };

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

  const quantityByProduct = new Map<string, number>();
  for (const sale of salesForCharts) {
    for (const item of sale.items) {
      const current = quantityByProduct.get(item.product.name) ?? 0;
      quantityByProduct.set(item.product.name, current + item.quantity);
    }
  }
  const topProductsByQuantity = [...quantityByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-ink">Panel Principal</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Un vistazo general a ventas, stock y cuentas corrientes.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-bg p-[18px]">
            <p className="text-[13px] text-ink-soft">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${statToneClass[stat.tone]}`}>{stat.value}</p>
            {stat.hint && <p className="mt-0.5 text-xs text-ink-faint">{stat.hint}</p>}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
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
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-bg p-5">
          <p className="text-sm font-semibold text-ink">Productos más vendidos</p>
          <p className="text-xs text-ink-faint">Por facturación, últimos {buckets.length} meses</p>
          <div className="mt-4">
            <DonutChart data={topProducts} formatValue={(v) => formatMoney(v)} />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-bg p-5">
          <p className="text-sm font-semibold text-ink">Productos más vendidos</p>
          <p className="text-xs text-ink-faint">Por cantidad de ventas, últimos {buckets.length} meses</p>
          <div className="mt-4">
            <DonutChart
              data={topProductsByQuantity}
              formatValue={(v) => new Intl.NumberFormat("es-AR").format(v)}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-bg p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">Gastos por pagar este mes</p>
          <Link href="/expenses" className="text-sm font-semibold text-accent hover:underline">
            Ver gastos →
          </Link>
        </div>
        {unpaidExpensesDueThisMonth.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">
            No hay gastos impagos con vencimiento este mes.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {unpaidExpensesDueThisMonth.map((e) => {
              const status = getExpenseStatus(e.dueDate, e.paidDate, startOfTodayUTC());
              return (
                <li key={e.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink-soft">
                    {e.expenseType.name}{" "}
                    <span className="text-ink-faint">· vence {formatDateOnly(e.dueDate)}</span>
                    <span
                      className={`ml-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${expenseStatusColors[status]}`}
                    >
                      {expenseStatusLabels[status]}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-semibold text-ink">{formatMoney(e.amount)}</span>
                    <MarkExpensePaidButton id={e.id} />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-bg p-5">
          <p className="text-sm font-semibold text-ink">Stock bajo</p>
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
            <Link
              href="/purchase-orders?status=pending&status=sent"
              className="text-sm font-semibold text-accent hover:underline"
            >
              Ver pedidos en curso →
            </Link>
          </div>
          {pendingPurchaseOrders.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">No hay pedidos pendientes.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {pendingPurchaseOrders.map((po) => {
                const sentAt = po.statusEvents[0]?.createdAt;
                const daysSinceSent = sentAt ? daysSince(sentAt) : 0;
                const isDelayed = po.status === "sent" && daysSinceSent > 7;
                return (
                  <li key={po.id} className="flex items-center justify-between text-sm">
                    <Link href={`/purchase-orders/${po.id}`} className="text-ink-soft hover:text-accent">
                      {po.supplier.name}
                    </Link>
                    <span className="flex items-center gap-1.5">
                      {isDelayed && (
                        <span className="rounded-md bg-err-bg px-2 py-0.5 text-xs font-semibold text-err-ink">
                          Demorado
                        </span>
                      )}
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${purchaseOrderStatusColors[po.status]}`}
                      >
                        {purchaseOrderStatusLabels[po.status]}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
