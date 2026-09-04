import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { getSupplierBalance } from "@/lib/ledger";
import { purchaseOrderStatusColors, purchaseOrderStatusLabels } from "@/lib/purchase-order-status";
import { updateSupplier, registerSupplierPayment } from "../actions";
import { SupplierForm } from "../SupplierForm";
import { PaymentForm } from "./PaymentForm";

export default async function SupplierDetailPage(
  props: PageProps<"/suppliers/[id]">,
) {
  const { id } = await props.params;
  const supplier = await db.supplier.findUnique({
    where: { id },
    include: {
      ledger: { orderBy: { createdAt: "desc" } },
      purchaseOrders: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!supplier) notFound();

  const balance = await getSupplierBalance(id);
  const boundUpdate = updateSupplier.bind(null, supplier.id);
  const boundPayment = registerSupplierPayment.bind(null, supplier.id);

  return (
    <div>
      <p className="text-sm text-ink-faint">
        <Link href="/suppliers" className="hover:text-accent">
          Proveedores
        </Link>{" "}
        / <span className="text-ink">{supplier.name}</span>
      </p>
      <h1 className="mt-1 text-2xl font-bold text-ink">{supplier.name}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="text-sm font-semibold text-ink">Datos del proveedor</p>
          <div className="mt-3">
            <SupplierForm
              action={boundUpdate}
              submitLabel="Guardar cambios"
              defaultValues={{
                name: supplier.name,
                taxId: supplier.taxId,
                email: supplier.email,
                phone: supplier.phone,
                address: supplier.address,
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-line bg-bg p-5">
            <p className="text-sm text-ink-soft">Saldo en cuenta corriente</p>
            <p
              className={`mt-1 text-3xl font-bold ${
                balance > 0 ? "text-err-ink" : balance < 0 ? "text-ok-ink" : "text-ink"
              }`}
            >
              {formatMoney(balance)}
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              {balance > 0
                ? "Le debemos este monto al proveedor."
                : balance < 0
                  ? "Tenemos saldo a favor."
                  : "Cuenta al día."}
            </p>
            <div className="mt-4 border-t border-line pt-4">
              <PaymentForm action={boundPayment} />
            </div>
          </div>

          <div className="rounded-xl border border-line bg-bg p-5">
            <p className="text-sm font-semibold text-ink">Movimientos de cuenta</p>
            {supplier.ledger.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">Todavía no hay movimientos.</p>
            ) : (
              <div className="mt-3 flex flex-col divide-y divide-line-soft">
                {supplier.ledger.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-ink">
                        {entry.type === "charge" ? "Pedido recibido" : "Pago"}
                        {entry.note ? ` · ${entry.note}` : ""}
                      </p>
                      <p className="text-xs text-ink-faint">{formatDate(entry.createdAt)}</p>
                    </div>
                    <span
                      className={`font-semibold ${
                        entry.type === "charge" ? "text-err-ink" : "text-ok-ink"
                      }`}
                    >
                      {entry.type === "charge" ? "+" : "−"}
                      {formatMoney(entry.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold text-ink">Últimos pedidos</p>
        {supplier.purchaseOrders.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Todavía no tiene pedidos.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-bg">
            <table className="w-full min-w-[480px] text-left text-sm">
              <tbody>
                {supplier.purchaseOrders.map((po) => (
                  <tr key={po.id} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 text-ink-soft">{formatDate(po.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${purchaseOrderStatusColors[po.status]}`}
                      >
                        {purchaseOrderStatusLabels[po.status]}
                      </span>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
