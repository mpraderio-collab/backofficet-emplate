import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { getCustomerBalance } from "@/lib/ledger";
import { updateCustomer, registerCustomerPayment } from "../actions";
import { CustomerForm } from "../CustomerForm";
import { PaymentForm } from "./PaymentForm";

export default async function CustomerDetailPage(
  props: PageProps<"/customers/[id]">,
) {
  const { id } = await props.params;
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      ledger: { orderBy: { createdAt: "desc" } },
      sales: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!customer) notFound();

  const balance = await getCustomerBalance(id);
  const boundUpdate = updateCustomer.bind(null, customer.id);
  const boundPayment = registerCustomerPayment.bind(null, customer.id);

  return (
    <div>
      <p className="text-sm text-ink-faint">
        <Link href="/customers" className="hover:text-accent">
          Clientes
        </Link>{" "}
        / <span className="text-ink">{customer.name}</span>
      </p>
      <h1 className="mt-1 text-2xl font-bold text-ink">{customer.name}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="text-sm font-semibold text-ink">Datos del cliente</p>
          <div className="mt-3">
            <CustomerForm
              action={boundUpdate}
              submitLabel="Guardar cambios"
              defaultValues={{
                name: customer.name,
                taxId: customer.taxId,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
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
                ? "El cliente nos debe este monto."
                : balance < 0
                  ? "Tiene saldo a favor."
                  : "Cuenta al día."}
            </p>
            <div className="mt-4 border-t border-line pt-4">
              <PaymentForm action={boundPayment} />
            </div>
          </div>

          <div className="rounded-xl border border-line bg-bg p-5">
            <p className="text-sm font-semibold text-ink">Movimientos de cuenta</p>
            {customer.ledger.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">Todavía no hay movimientos.</p>
            ) : (
              <div className="mt-3 flex flex-col divide-y divide-line-soft">
                {customer.ledger.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-ink">
                        {entry.type === "charge" ? "Venta" : "Pago"}
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
        <p className="text-sm font-semibold text-ink">Últimas ventas</p>
        {customer.sales.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Todavía no tiene ventas.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-bg">
            <table className="w-full min-w-[420px] text-left text-sm">
              <tbody>
                {customer.sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 text-ink-soft">{formatDate(sale.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-ink">{formatMoney(sale.total)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/sales/${sale.id}`}
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
