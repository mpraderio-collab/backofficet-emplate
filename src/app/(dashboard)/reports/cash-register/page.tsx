import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { paymentMethods, paymentMethodLabels, type PaymentMethod } from "@/lib/payment-method";
import { toDateInputValue } from "@/lib/reports";

export default async function CashRegisterReportPage(props: PageProps<"/reports/cash-register">) {
  const searchParams = await props.searchParams;
  const dateParam = typeof searchParams?.date === "string" ? searchParams.date : undefined;
  const hasFilters = Boolean(dateParam);
  const day = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();
  day.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  const [customerPayments, supplierPayments, expenses] = await Promise.all([
    db.customerLedgerEntry.findMany({
      where: { type: "payment", createdAt: { gte: day, lte: dayEnd } },
      select: { amount: true, paymentMethod: true },
    }),
    db.supplierLedgerEntry.findMany({
      where: { type: "payment", createdAt: { gte: day, lte: dayEnd } },
      select: { amount: true, paymentMethod: true },
    }),
    db.expense.findMany({
      where: { date: { gte: day, lte: dayEnd } },
      select: { amount: true, paymentMethod: true },
    }),
  ]);

  const byMethod = new Map<string, { in: number; out: number }>();
  for (const method of paymentMethods) byMethod.set(method, { in: 0, out: 0 });

  for (const p of customerPayments) {
    const key = p.paymentMethod ?? "other";
    const row = byMethod.get(key) ?? { in: 0, out: 0 };
    row.in += p.amount;
    byMethod.set(key, row);
  }
  for (const p of supplierPayments) {
    const key = p.paymentMethod ?? "other";
    const row = byMethod.get(key) ?? { in: 0, out: 0 };
    row.out += p.amount;
    byMethod.set(key, row);
  }
  for (const e of expenses) {
    const key = e.paymentMethod ?? "other";
    const row = byMethod.get(key) ?? { in: 0, out: 0 };
    row.out += e.amount;
    byMethod.set(key, row);
  }

  const rows = [...byMethod.entries()]
    .map(([method, { in: cashIn, out: cashOut }]) => ({
      method,
      in: cashIn,
      out: cashOut,
      net: cashIn - cashOut,
    }))
    .filter((r) => r.in !== 0 || r.out !== 0);

  const totalIn = rows.reduce((sum, r) => sum + r.in, 0);
  const totalOut = rows.reduce((sum, r) => sum + r.out, 0);

  return (
    <div>
      <p className="text-sm text-ink-faint">
        <Link href="/reports" className="hover:text-accent">
          Informes
        </Link>{" "}
        / <span className="text-ink">Caja diaria</span>
      </p>
      <h1 className="mt-1 text-2xl font-bold text-ink">Caja diaria</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Cobros a clientes, pagos a proveedores y gastos del día, agrupados por método de pago.
      </p>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-4" method="get">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Día</span>
          <input type="date" name="date" defaultValue={toDateInputValue(day)} className="input" />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Ver
        </button>
        {hasFilters && (
          <Link
            href="/reports/cash-register"
            className="rounded-lg border border-border-input bg-bg px-3 py-2 text-xs font-semibold text-ink hover:bg-surface"
          >
            Limpiar filtros
          </Link>
        )}
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-bg p-[18px]">
          <p className="text-[13px] text-ink-soft">Ingresos (cobros)</p>
          <p className="mt-1 text-2xl font-bold text-ok-ink">{formatMoney(totalIn)}</p>
        </div>
        <div className="rounded-xl border border-line bg-bg p-[18px]">
          <p className="text-[13px] text-ink-soft">Egresos (pagos + gastos)</p>
          <p className="mt-1 text-2xl font-bold text-err-ink">{formatMoney(totalOut)}</p>
        </div>
        <div className="rounded-xl border border-line bg-bg p-[18px]">
          <p className="text-[13px] text-ink-soft">Neto del día</p>
          <p className="mt-1 text-2xl font-bold text-ink">{formatMoney(totalIn - totalOut)}</p>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold text-ink">Por método de pago</p>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No hubo movimientos ese día.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-bg">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3">Ingresos</th>
                  <th className="px-4 py-3">Egresos</th>
                  <th className="px-4 py-3">Neto</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.method} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 text-ink">
                      {paymentMethodLabels[r.method as PaymentMethod] ?? r.method}
                    </td>
                    <td className="px-4 py-3 text-ok-ink">{r.in > 0 ? formatMoney(r.in) : "—"}</td>
                    <td className="px-4 py-3 text-err-ink">{r.out > 0 ? formatMoney(r.out) : "—"}</td>
                    <td className="px-4 py-3 font-medium text-ink">{formatMoney(r.net)}</td>
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
