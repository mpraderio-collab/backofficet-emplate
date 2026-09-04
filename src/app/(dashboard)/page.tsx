import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { getAllCustomerBalances, getAllSupplierBalances } from "@/lib/ledger";
import { purchaseOrderStatusColors, purchaseOrderStatusLabels } from "@/lib/purchase-order-status";

export default async function DashboardPage() {
  const [
    productCount,
    lowStockProducts,
    pendingPurchaseOrders,
    customerBalances,
    supplierBalances,
    recentSales,
  ] = await Promise.all([
    db.product.count({ where: { status: "active" } }),
    db.product.findMany({
      where: { status: "active", stock: { lte: 5 } },
      orderBy: { stock: "asc" },
      take: 6,
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
  ]);

  const totalReceivable = [...customerBalances.values()].reduce(
    (sum, b) => sum + Math.max(b, 0),
    0,
  );
  const totalPayable = [...supplierBalances.values()].reduce(
    (sum, b) => sum + Math.max(b, 0),
    0,
  );

  const stats = [
    { label: "Productos activos", value: productCount },
    { label: "Por cobrar a clientes", value: formatMoney(totalReceivable) },
    { label: "Por pagar a proveedores", value: formatMoney(totalPayable) },
    { label: "Pedidos en curso", value: pendingPurchaseOrders.length },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Resumen</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-bg p-[18px]">
            <p className="text-[13px] text-ink-soft">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
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
                    {p.stock === 0 ? "sin stock" : `${p.stock} u.`}
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
