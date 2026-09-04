import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatMoney, formatQuantity } from "@/lib/format";
import { CancelSaleButton } from "./CancelSaleButton";

export default async function SaleDetailPage(props: PageProps<"/sales/[id]">) {
  const { id } = await props.params;
  const sale = await db.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: { select: { name: true, fractionUnit: true } } } },
    },
  });
  if (!sale) notFound();

  return (
    <div>
      <p className="text-sm text-ink-faint">
        <Link href="/sales" className="hover:text-accent">
          Ventas
        </Link>{" "}
        / <span className="text-ink">{formatDate(sale.createdAt)}</span>
      </p>
      <div className="mt-1 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-ink">Venta a {sale.customer.name}</h1>
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
            sale.status === "confirmed" ? "bg-ok-bg text-ok-ink" : "bg-line-soft text-ink-faint"
          }`}
        >
          {sale.status === "confirmed" ? "Confirmada" : "Cancelada"}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-soft">{formatDate(sale.createdAt)}</p>

      <div className="mt-6 max-w-2xl overflow-x-auto rounded-xl border border-line bg-bg">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-ink-soft">
            <tr>
              <th className="px-4 py-2 font-medium">Producto</th>
              <th className="px-4 py-2 font-medium">Cant.</th>
              <th className="px-4 py-2 font-medium">Precio unit.</th>
              <th className="px-4 py-2 font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id} className="border-b border-line-soft last:border-0">
                <td className="px-4 py-2 text-ink">{item.product.name}</td>
                <td className="px-4 py-2 text-ink-soft">
                  {item.saleUnit === "fraction"
                    ? formatQuantity(item.quantity, item.product.fractionUnit)
                    : `${item.quantity} u.`}
                </td>
                <td className="px-4 py-2 text-ink-soft">{formatMoney(item.unitPrice)}</td>
                <td className="px-4 py-2 text-ink">
                  {formatMoney(item.unitPrice * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-line px-4 py-3 text-right text-sm font-semibold text-ink">
          Total: {formatMoney(sale.total)}
        </div>
      </div>

      {sale.note && (
        <p className="mt-4 max-w-2xl text-sm text-ink-soft">
          <span className="font-semibold text-ink">Nota:</span> {sale.note}
        </p>
      )}

      <p className="mt-4 text-sm">
        <Link href={`/customers/${sale.customerId}`} className="font-semibold text-accent hover:underline">
          Ver cuenta corriente de {sale.customer.name} →
        </Link>
      </p>

      {sale.status === "confirmed" && <CancelSaleButton id={sale.id} />}
    </div>
  );
}
