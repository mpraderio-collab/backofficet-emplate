import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { getAllCustomerBalances, getAllSupplierBalances } from "@/lib/ledger";

type Bucket = "0-30" | "31-60" | "60+";

function bucketFor(days: number): Bucket {
  if (days <= 30) return "0-30";
  if (days <= 60) return "31-60";
  return "60+";
}

const bucketLabels: Record<Bucket, string> = {
  "0-30": "0 a 30 días",
  "31-60": "31 a 60 días",
  "60+": "Más de 60 días",
};

export default async function AgingReportPage() {
  const now = new Date();

  const [customerBalances, supplierBalances, oldestCustomerCharges, oldestSupplierCharges, customers, suppliers] =
    await Promise.all([
      getAllCustomerBalances(),
      getAllSupplierBalances(),
      db.customerLedgerEntry.groupBy({
        by: ["customerId"],
        where: { type: "charge" },
        _min: { createdAt: true },
      }),
      db.supplierLedgerEntry.groupBy({
        by: ["supplierId"],
        where: { type: "charge" },
        _min: { createdAt: true },
      }),
      db.customer.findMany({ select: { id: true, name: true } }),
      db.supplier.findMany({ select: { id: true, name: true } }),
    ]);

  const oldestChargeByCustomer = new Map(
    oldestCustomerCharges.map((r) => [r.customerId, r._min.createdAt]),
  );
  const oldestChargeBySupplier = new Map(
    oldestSupplierCharges.map((r) => [r.supplierId, r._min.createdAt]),
  );
  const customerNameById = new Map(customers.map((c) => [c.id, c.name]));
  const supplierNameById = new Map(suppliers.map((s) => [s.id, s.name]));

  function buildRows(
    balances: Map<string, number>,
    oldestChargeById: Map<string, Date | null>,
    nameById: Map<string, string>,
  ) {
    const rows: { id: string; name: string; balance: number; days: number; bucket: Bucket }[] = [];
    for (const [id, balance] of balances) {
      if (balance <= 0) continue;
      const oldest = oldestChargeById.get(id);
      const days = oldest ? Math.floor((now.getTime() - oldest.getTime()) / 86_400_000) : 0;
      rows.push({ id, name: nameById.get(id) ?? "—", balance, days, bucket: bucketFor(days) });
    }
    return rows.sort((a, b) => b.days - a.days);
  }

  const receivable = buildRows(customerBalances, oldestChargeByCustomer, customerNameById);
  const payable = buildRows(supplierBalances, oldestChargeBySupplier, supplierNameById);

  function totalsByBucket(rows: { balance: number; bucket: Bucket }[]) {
    const totals: Record<Bucket, number> = { "0-30": 0, "31-60": 0, "60+": 0 };
    for (const r of rows) totals[r.bucket] += r.balance;
    return totals;
  }

  const receivableTotals = totalsByBucket(receivable);
  const payableTotals = totalsByBucket(payable);

  const totalReceivable = receivable.reduce((s, r) => s + r.balance, 0);
  const totalPayable = payable.reduce((s, r) => s + r.balance, 0);
  const netBalance = totalReceivable - totalPayable;

  return (
    <div>
      <p className="text-sm text-ink-faint">
        <Link href="/reports" className="hover:text-accent">
          Informes
        </Link>{" "}
        / <span className="text-ink">Cuentas por cobrar y pagar</span>
      </p>
      <h1 className="mt-1 text-2xl font-bold text-ink">Cuentas por cobrar y pagar</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        Antigüedad estimada desde el cargo (venta o pedido recibido) más viejo todavía pendiente de
        cada cuenta con saldo — una aproximación, no un seguimiento factura por factura.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Por cobrar a clientes</p>
            <p className="text-sm font-bold text-ok-ink">{formatMoney(totalReceivable)}</p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            {(Object.keys(bucketLabels) as Bucket[]).map((b) => (
              <div key={b} className="rounded-lg border border-line bg-surface p-2">
                <p className="text-ink-faint">{bucketLabels[b]}</p>
                <p className="mt-0.5 font-semibold text-ink">{formatMoney(receivableTotals[b])}</p>
              </div>
            ))}
          </div>
          {receivable.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">Ningún cliente tiene saldo pendiente.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-bg">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                    <th className="px-4 py-2">Cliente</th>
                    <th className="px-4 py-2">Antigüedad</th>
                    <th className="px-4 py-2">Saldo</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {receivable.map((r) => (
                    <tr key={r.id} className="border-b border-line-soft last:border-0">
                      <td className="px-4 py-2 text-ink">{r.name}</td>
                      <td className="px-4 py-2 text-ink-soft">{bucketLabels[r.bucket]}</td>
                      <td className="px-4 py-2 font-medium text-ink">{formatMoney(r.balance)}</td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          href={`/customers/${r.id}`}
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

        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Por pagar a proveedores</p>
            <p className="text-sm font-bold text-err-ink">{formatMoney(totalPayable)}</p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            {(Object.keys(bucketLabels) as Bucket[]).map((b) => (
              <div key={b} className="rounded-lg border border-line bg-surface p-2">
                <p className="text-ink-faint">{bucketLabels[b]}</p>
                <p className="mt-0.5 font-semibold text-ink">{formatMoney(payableTotals[b])}</p>
              </div>
            ))}
          </div>
          {payable.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">No le debemos a ningún proveedor.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-bg">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                    <th className="px-4 py-2">Proveedor</th>
                    <th className="px-4 py-2">Antigüedad</th>
                    <th className="px-4 py-2">Saldo</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {payable.map((r) => (
                    <tr key={r.id} className="border-b border-line-soft last:border-0">
                      <td className="px-4 py-2 text-ink">{r.name}</td>
                      <td className="px-4 py-2 text-ink-soft">{bucketLabels[r.bucket]}</td>
                      <td className="px-4 py-2 font-medium text-ink">{formatMoney(r.balance)}</td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          href={`/suppliers/${r.id}`}
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

      <div className="mt-8 flex items-center justify-between rounded-xl border border-line bg-surface p-5">
        <div>
          <p className="text-sm font-semibold text-ink">Saldo neto</p>
          <p className="mt-0.5 text-xs text-ink-faint">
            {formatMoney(totalReceivable)} por cobrar − {formatMoney(totalPayable)} por pagar
          </p>
        </div>
        <p className={`text-xl font-bold ${netBalance >= 0 ? "text-ok-ink" : "text-err-ink"}`}>
          {formatMoney(netBalance)}
        </p>
      </div>
    </div>
  );
}
