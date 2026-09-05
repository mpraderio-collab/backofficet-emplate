import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatDateOnly, formatMoney, formatQuantity } from "@/lib/format";
import { purchaseOrderStatusColors, purchaseOrderStatusLabels } from "@/lib/purchase-order-status";
import { StatusActions } from "./StatusActions";
import { ReceiveOrderForm } from "./ReceiveOrderForm";
import { ExportActions } from "./ExportActions";

function productCharacteristics(product: {
  brand: string | null;
  animalType: string | null;
  animalSize: string | null;
  animalWeight: string | null;
}): string {
  return [product.brand, product.animalType, product.animalSize, product.animalWeight]
    .filter(Boolean)
    .join(" · ");
}

export default async function PurchaseOrderDetailPage(
  props: PageProps<"/purchase-orders/[id]">,
) {
  const { id } = await props.params;
  const po = await db.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: {
        include: {
          product: {
            select: {
              name: true,
              fractionUnit: true,
              cost: true,
              brand: true,
              animalType: true,
              animalSize: true,
              animalWeight: true,
            },
          },
        },
      },
      statusEvents: {
        orderBy: { createdAt: "asc" },
        include: { createdByUser: { select: { name: true } } },
      },
    },
  });
  if (!po) notFound();

  const total = po.items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);

  return (
    <div>
      <p className="print:hidden text-sm text-ink-faint">
        <Link href="/purchase-orders" className="hover:text-accent">
          Pedidos a proveedores
        </Link>{" "}
        / <span className="text-ink">{formatDateOnly(po.orderDate)}</span>
      </p>
      <div className="mt-1 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-ink">Pedido a {po.supplier.name}</h1>
        <span
          className={`print:hidden rounded-md px-2 py-0.5 text-xs font-semibold ${purchaseOrderStatusColors[po.status]}`}
        >
          {purchaseOrderStatusLabels[po.status]}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-soft">Fecha del pedido: {formatDateOnly(po.orderDate)}</p>

      <ExportActions
        fileName={`pedido-${po.supplier.name}-${formatDateOnly(po.orderDate).replaceAll("/", "-")}`}
        supplierName={po.supplier.name}
        orderDate={formatDateOnly(po.orderDate)}
        items={po.items.map((item) => ({
          productName: item.product.name,
          characteristics: productCharacteristics(item.product),
          quantity: item.quantity,
          unitCost: item.unitCost,
          subtotal: item.unitCost * item.quantity,
        }))}
        total={total}
      />

      <div className="mt-6 max-w-2xl overflow-x-auto rounded-xl border border-line bg-bg">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-ink-soft">
            <tr>
              <th className="px-4 py-2 font-medium">Producto</th>
              <th className="px-4 py-2 font-medium">Cant.</th>
              <th className="px-4 py-2 font-medium">Costo unit.</th>
              <th className="px-4 py-2 font-medium">Subtotal</th>
              {po.status === "received" && (
                <>
                  <th className="px-4 py-2 font-medium">Recibido</th>
                  <th className="px-4 py-2 font-medium">Sumó al stock</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {po.items.map((item) => (
              <tr key={item.id} className="border-b border-line-soft last:border-0">
                <td className="px-4 py-2 text-ink">
                  {item.product.name}
                  {productCharacteristics(item.product) && (
                    <p className="text-xs font-normal text-ink-faint">
                      {productCharacteristics(item.product)}
                    </p>
                  )}
                </td>
                <td className="px-4 py-2 text-ink-soft">{item.quantity} u.</td>
                <td className="px-4 py-2 text-ink-soft">{formatMoney(item.unitCost)}</td>
                <td className="px-4 py-2 text-ink">
                  {formatMoney(item.unitCost * item.quantity)}
                </td>
                {po.status === "received" && (
                  <>
                    <td className="px-4 py-2 text-ink-soft">
                      {item.receivedQuantity != null
                        ? `${item.receivedQuantity} u.`
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-ink-soft">
                      {item.stockDelta != null
                        ? formatQuantity(item.stockDelta, item.product.fractionUnit)
                        : "—"}
                    </td>
                  </>
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

      <p className="print:hidden mt-4 text-sm">
        <Link
          href={`/suppliers/${po.supplierId}`}
          className="font-semibold text-accent hover:underline"
        >
          Ver cuenta corriente de {po.supplier.name} →
        </Link>
      </p>

      {po.statusEvents.length > 0 && (
        <div className="mt-6 max-w-2xl">
          <p className="text-sm font-semibold text-ink">Seguimiento del pedido</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {po.statusEvents.map((event) => (
              <li key={event.id} className="flex items-center gap-2 text-sm">
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-semibold ${purchaseOrderStatusColors[event.status]}`}
                >
                  {purchaseOrderStatusLabels[event.status] ?? event.status}
                </span>
                <span className="text-ink-soft">
                  {formatDate(event.createdAt)}
                  {event.createdByUser && ` · por ${event.createdByUser.name}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="print:hidden">
        {po.status === "sent" && (
          <ReceiveOrderForm
            purchaseOrderId={po.id}
            items={po.items.map((item) => ({
              id: item.id,
              productName: item.product.name,
              productCharacteristics: productCharacteristics(item.product),
              quantity: item.quantity,
              unitCost: item.unitCost,
              currentCost: item.product.cost,
            }))}
          />
        )}

        <StatusActions id={po.id} status={po.status} />
      </div>
    </div>
  );
}
