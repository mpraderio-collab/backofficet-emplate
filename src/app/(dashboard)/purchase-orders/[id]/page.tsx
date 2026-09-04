import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatMoney, formatQuantity } from "@/lib/format";
import { purchaseOrderStatusColors, purchaseOrderStatusLabels } from "@/lib/purchase-order-status";
import { StatusActions } from "./StatusActions";

export default async function PurchaseOrderDetailPage(
  props: PageProps<"/purchase-orders/[id]">,
) {
  const { id } = await props.params;
  const po = await db.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: { include: { product: { select: { name: true, fractionUnit: true } } } },
    },
  });
  if (!po) notFound();

  const total = po.items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);

  return (
    <div>
      <p className="text-sm text-ink-faint">
        <Link href="/purchase-orders" className="hover:text-accent">
          Pedidos a proveedores
        </Link>{" "}
        / <span className="text-ink">{formatDate(po.createdAt)}</span>
      </p>
      <div className="mt-1 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-ink">Pedido a {po.supplier.name}</h1>
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-semibold ${purchaseOrderStatusColors[po.status]}`}
        >
          {purchaseOrderStatusLabels[po.status]}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-soft">{formatDate(po.createdAt)}</p>

      <div className="mt-6 max-w-2xl overflow-x-auto rounded-xl border border-line bg-bg">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-ink-soft">
            <tr>
              <th className="px-4 py-2 font-medium">Producto</th>
              <th className="px-4 py-2 font-medium">Cant.</th>
              <th className="px-4 py-2 font-medium">Costo unit.</th>
              <th className="px-4 py-2 font-medium">Subtotal</th>
              {po.status === "received" && (
                <th className="px-4 py-2 font-medium">Sumó al stock</th>
              )}
            </tr>
          </thead>
          <tbody>
            {po.items.map((item) => (
              <tr key={item.id} className="border-b border-line-soft last:border-0">
                <td className="px-4 py-2 text-ink">{item.product.name}</td>
                <td className="px-4 py-2 text-ink-soft">{item.quantity} u.</td>
                <td className="px-4 py-2 text-ink-soft">{formatMoney(item.unitCost)}</td>
                <td className="px-4 py-2 text-ink">
                  {formatMoney(item.unitCost * item.quantity)}
                </td>
                {po.status === "received" && (
                  <td className="px-4 py-2 text-ink-soft">
                    {item.stockDelta != null
                      ? formatQuantity(item.stockDelta, item.product.fractionUnit)
                      : "—"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-line px-4 py-3 text-right text-sm font-semibold text-ink">
          Total: {formatMoney(total)}
        </div>
      </div>

      {po.note && (
        <p className="mt-4 max-w-2xl text-sm text-ink-soft">
          <span className="font-semibold text-ink">Nota:</span> {po.note}
        </p>
      )}

      <p className="mt-4 text-sm">
        <Link
          href={`/suppliers/${po.supplierId}`}
          className="font-semibold text-accent hover:underline"
        >
          Ver cuenta corriente de {po.supplier.name} →
        </Link>
      </p>

      <StatusActions id={po.id} status={po.status} />
    </div>
  );
}
