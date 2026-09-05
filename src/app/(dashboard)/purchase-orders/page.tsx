import Link from "next/link";
import { db } from "@/lib/db";
import { formatDateOnly } from "@/lib/format";
import { purchaseOrderStatusColors, purchaseOrderStatusLabels } from "@/lib/purchase-order-status";
import { daysSince } from "@/lib/reports";

const DELAYED_AFTER_DAYS = 7;

export default async function PurchaseOrdersPage(props: PageProps<"/purchase-orders">) {
  const searchParams = await props.searchParams;
  const statusParam = typeof searchParams?.status === "string" ? searchParams.status : "";
  const supplierIdParam =
    typeof searchParams?.supplierId === "string" ? searchParams.supplierId : "";
  const fromParam = typeof searchParams?.from === "string" ? searchParams.from : "";
  const toParam = typeof searchParams?.to === "string" ? searchParams.to : "";

  const [purchaseOrders, suppliers] = await Promise.all([
    db.purchaseOrder.findMany({
      where: {
        ...(statusParam && { status: statusParam }),
        ...(supplierIdParam && { supplierId: supplierIdParam }),
        ...((fromParam || toParam) && {
          orderDate: {
            ...(fromParam && { gte: new Date(`${fromParam}T00:00:00`) }),
            ...(toParam && { lte: new Date(`${toParam}T23:59:59`) }),
          },
        }),
      },
      orderBy: { orderDate: "desc" },
      include: {
        supplier: { select: { name: true } },
        items: true,
        statusEvents: { where: { status: "sent" }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    db.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const hasFilters = statusParam || supplierIdParam || fromParam || toParam;

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

      <form
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-4"
        method="get"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Estado</span>
          <select name="status" defaultValue={statusParam} className="input">
            <option value="">Todos</option>
            {Object.entries(purchaseOrderStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Proveedor</span>
          <select name="supplierId" defaultValue={supplierIdParam} className="input">
            <option value="">Todos</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Desde</span>
          <input type="date" name="from" defaultValue={fromParam} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Hasta</span>
          <input type="date" name="to" defaultValue={toParam} className="input" />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Filtrar
        </button>
        {hasFilters && (
          <Link
            href="/purchase-orders"
            className="rounded-lg border border-border-input bg-bg px-3 py-2 text-xs font-semibold text-ink hover:bg-surface"
          >
            Limpiar filtros
          </Link>
        )}
      </form>

      {purchaseOrders.length === 0 ? (
        <p className="mt-6 text-ink-soft">
          {hasFilters
            ? "Ningún pedido coincide con estos filtros."
            : "Todavía no hay pedidos registrados."}
        </p>
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
