import Link from "next/link";
import { db } from "@/lib/db";
import { formatDateOnly } from "@/lib/format";
import { purchaseOrderStatusColors, purchaseOrderStatusLabels } from "@/lib/purchase-order-status";
import { daysSince } from "@/lib/reports";

const DELAYED_AFTER_DAYS = 7;

export default async function PurchaseOrdersPage() {
  const purchaseOrders = await db.purchaseOrder.findMany({
    orderBy: { orderDate: "desc" },
    include: {
      supplier: { select: { name: true } },
      items: true,
      statusEvents: { where: { status: "sent" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Pedidos a proveedores</h1>
        <Link
          href="/purchase-orders/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover"
        >
          + Nuevo pedido
        </Link>
      </div>

      {purchaseOrders.length === 0 ? (
        <p className="mt-6 text-ink-soft">Todavía no hay pedidos registrados.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Ítems</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => {
                const sentAt = po.statusEvents[0]?.createdAt;
                const daysSinceSent = sentAt ? daysSince(sentAt) : 0;
                const isDelayed = po.status === "sent" && daysSinceSent > DELAYED_AFTER_DAYS;
                return (
                <tr key={po.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3 text-ink-soft">{formatDateOnly(po.orderDate)}</td>
                  <td className="px-4 py-3 font-medium text-ink">{po.supplier.name}</td>
                  <td className="px-4 py-3 text-ink-soft">{po.items.length}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${purchaseOrderStatusColors[po.status]}`}
                    >
                      {purchaseOrderStatusLabels[po.status]}
                    </span>
                    {isDelayed && (
                      <span
                        className="ml-1.5 rounded-md bg-err-bg px-2 py-0.5 text-xs font-semibold text-err-ink"
                        title={`Enviado hace ${daysSinceSent} días sin recibirse`}
                      >
                        Demorado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/purchase-orders/${po.id}`}
                      className="font-semibold text-accent hover:underline"
                    >
                      Ver
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
