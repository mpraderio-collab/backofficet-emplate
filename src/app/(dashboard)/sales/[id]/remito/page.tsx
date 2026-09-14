import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatQuantity } from "@/lib/format";
import { getRemitoBusinessInfo } from "@/lib/remito";
import { PrintButton } from "./PrintButton";

export default async function RemitoPage(props: PageProps<"/sales/[id]/remito">) {
  const { id } = await props.params;

  const sale = await db.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      branch: { select: { name: true } },
      items: { include: { product: { select: { name: true, fractionUnit: true } } } },
      remito: true,
    },
  });
  if (!sale || !sale.remito) notFound();

  const business = getRemitoBusinessInfo();
  const remitoCode = `${sale.branch.name}-${sale.remito.number.toString().padStart(6, "0")}`;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="print:hidden mb-6 flex items-center justify-between">
        <Link href={`/sales/${sale.id}`} className="text-sm text-ink-faint hover:text-accent">
          ← Volver a la venta
        </Link>
        <PrintButton />
      </div>

      {sale.remito.status === "voided" && (
        <p className="print:hidden mb-4 rounded-lg border border-err-line bg-err-bg px-3 py-2 text-sm font-semibold text-err-ink">
          Este remito está anulado — la venta que lo originó fue cancelada.
        </p>
      )}

      <div className="rounded-xl border border-line bg-bg p-8 print:border-0 print:p-0">
        <div className="flex items-start justify-between gap-6 border-b border-line pb-5">
          <div>
            <p className="text-base font-bold text-ink">{business.name}</p>
            <p className="text-sm text-ink-soft">{business.address}</p>
            <p className="text-sm text-ink-soft">CUIT {business.taxId}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold tracking-wide text-ink">REMITO</p>
            <p className="text-sm text-ink-soft">N.° {remitoCode}</p>
            <p className="text-sm text-ink-soft">{formatDate(sale.createdAt)}</p>
            {sale.remito.status === "voided" && (
              <p className="mt-1 text-sm font-semibold text-err-ink">ANULADO</p>
            )}
          </div>
        </div>

        <div className="mt-5 border-b border-line pb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Destinatario
          </p>
          {sale.customer ? (
            <>
              <p className="mt-1 text-sm font-semibold text-ink">{sale.customer.name}</p>
              {sale.customer.taxId && (
                <p className="text-sm text-ink-soft">CUIT/DNI {sale.customer.taxId}</p>
              )}
              {(sale.customer.address || sale.customer.city) && (
                <p className="text-sm text-ink-soft">
                  {[sale.customer.address, sale.customer.city].filter(Boolean).join(", ")}
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-sm font-semibold text-ink">Consumidor final</p>
          )}
        </div>

        <table className="mt-5 w-full text-left text-sm">
          <thead className="border-b border-line text-ink-soft">
            <tr>
              <th className="py-2 font-medium">Producto</th>
              <th className="py-2 text-right font-medium">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id} className="border-b border-line-soft last:border-0">
                <td className="py-2 text-ink">{item.product.name}</td>
                <td className="py-2 text-right text-ink-soft">
                  {item.saleUnit === "fraction"
                    ? formatQuantity(item.quantity, item.product.fractionUnit)
                    : `${item.quantity} u.`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-16 grid grid-cols-2 gap-10 text-sm text-ink-soft">
          <div className="border-t border-ink-faint pt-2">Firma</div>
          <div className="border-t border-ink-faint pt-2">Aclaración y DNI</div>
        </div>
      </div>
    </div>
  );
}
