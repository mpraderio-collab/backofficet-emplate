import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatDateOnly, formatMoney } from "@/lib/format";
import { paymentMethodLabels, type PaymentMethod } from "@/lib/payment-method";
import {
  endOfTodayUTC,
  startOfMonthUTC,
  startOfTodayUTC,
  startOfYearUTC,
  toDateInputValueUTC,
} from "@/lib/reports";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { getExpenseStatus, expenseStatusLabels, expenseStatusColors } from "@/lib/expense-status";
import { DeleteExpenseButton } from "./DeleteExpenseButton";
import { MarkExpensePaidButton } from "./MarkExpensePaidButton";

export default async function ExpensesPage(props: PageProps<"/expenses">) {
  const searchParams = await props.searchParams;
  const fromParam = typeof searchParams?.from === "string" ? searchParams.from : undefined;
  const toParam = typeof searchParams?.to === "string" ? searchParams.to : undefined;

  // dueDate se guarda como medianoche UTC (viene de un <input type="date">
  // sin hora) — armar estos límites en UTC para no dejar afuera un
  // vencimiento justo en el primer o último día del rango.
  const from = fromParam ? new Date(`${fromParam}T00:00:00Z`) : startOfMonthUTC();
  const to = toParam ? new Date(`${toParam}T23:59:59Z`) : endOfTodayUTC();
  const hasFilters = Boolean(fromParam || toParam);

  const expenses = await db.expense.findMany({
    where: { dueDate: { gte: from, lte: to } },
    orderBy: { dueDate: "desc" },
    include: {
      expenseType: { select: { name: true } },
      createdByUser: { select: { name: true } },
    },
  });

  const today = startOfTodayUTC();
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const overdueExpenses = expenses.filter(
    (e) => getExpenseStatus(e.dueDate, e.paidDate, today) === "overdue",
  );
  const totalOverdue = overdueExpenses.reduce((sum, e) => sum + e.amount, 0);

  const byType = new Map<string, number>();
  for (const e of expenses) {
    byType.set(e.expenseType.name, (byType.get(e.expenseType.name) ?? 0) + e.amount);
  }
  const typeBreakdown = [...byType.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  const quickRanges = [
    { label: "Hoy", from: startOfTodayUTC(), to: endOfTodayUTC() },
    { label: "Este mes", from: startOfMonthUTC(), to: endOfTodayUTC() },
    { label: "Este año", from: startOfYearUTC(), to: endOfTodayUTC() },
  ];
  const activeRangeLabel = quickRanges.find(
    (r) =>
      toDateInputValueUTC(r.from) === toDateInputValueUTC(from) &&
      toDateInputValueUTC(r.to) === toDateInputValueUTC(to),
  )?.label;

  const exportRows: (string | number)[][] = [
    [`Gastos: ${toDateInputValueUTC(from)} a ${toDateInputValueUTC(to)}`],
    [],
    ["Vencimiento", "Estado", "Fecha de pago", "Tipo", "Método", "Monto", "Nota"],
    ...expenses.map((e) => [
      formatDateOnly(e.dueDate),
      expenseStatusLabels[getExpenseStatus(e.dueDate, e.paidDate, today)],
      e.paidDate ? formatDate(e.paidDate) : "",
      e.expenseType.name,
      paymentMethodLabels[e.paymentMethod as PaymentMethod] ?? e.paymentMethod,
      e.amount,
      e.note ?? "",
    ]),
    [],
    ["Total", "", "", "", "", totalExpenses, ""],
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Gastos</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Impuestos, servicios y demás gastos del negocio, independientes de proveedores.
          </p>
        </div>
        <div className="flex gap-3">
          <ExportCsvButton
            fileName={`gastos-${toDateInputValueUTC(from)}-a-${toDateInputValueUTC(to)}`}
            rows={exportRows}
          />
          <Link
            href="/expenses/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover"
          >
            + Nuevo gasto
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-4 rounded-xl border border-line bg-surface p-4">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Desde</span>
            <input type="date" name="from" defaultValue={toDateInputValueUTC(from)} className="input" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Hasta</span>
            <input type="date" name="to" defaultValue={toDateInputValueUTC(to)} className="input" />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Filtrar
          </button>
        </form>
        <div className="flex gap-2">
          {quickRanges.map((r) => {
            const isActive = r.label === activeRangeLabel;
            return (
              <Link
                key={r.label}
                href={`/expenses?from=${toDateInputValueUTC(r.from)}&to=${toDateInputValueUTC(r.to)}`}
                className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
                  isActive
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border-input bg-bg text-ink hover:bg-surface"
                }`}
              >
                {isActive && "✓ "}
                {r.label}
              </Link>
            );
          })}
          {hasFilters && (
            <Link
              href="/expenses"
              className="rounded-lg border border-border-input bg-bg px-3 py-2 text-xs font-semibold text-ink hover:bg-surface"
            >
              Limpiar filtros
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-bg p-[18px]">
          <p className="text-[13px] text-ink-soft">Total de gastos</p>
          <p className="mt-1 text-2xl font-bold text-ink">{formatMoney(totalExpenses)}</p>
        </div>
        <div className="rounded-xl border border-line bg-bg p-[18px]">
          <p className="text-[13px] text-ink-soft">Cantidad de gastos</p>
          <p className="mt-1 text-2xl font-bold text-ink">{expenses.length}</p>
        </div>
        <div className="rounded-xl border border-line bg-bg p-[18px]">
          <p className="text-[13px] text-ink-soft">Vencidos y sin pagar</p>
          <p className="mt-1 text-2xl font-bold text-err-ink">{formatMoney(totalOverdue)}</p>
          {overdueExpenses.length > 0 && (
            <p className="mt-0.5 text-xs text-ink-faint">
              {overdueExpenses.length} gasto{overdueExpenses.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold text-ink">Gastos por tipo</p>
        {typeBreakdown.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No hay gastos en este período.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-bg">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {typeBreakdown.map((t) => (
                  <tr key={t.name} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 text-ink">{t.name}</td>
                    <td className="px-4 py-3 font-medium text-ink">{formatMoney(t.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold text-ink">Detalle de gastos</p>
        {expenses.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No hay gastos en este período.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-bg">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-4 py-3">Vencimiento</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Nota</th>
                  <th className="px-4 py-3">Cargado por</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => {
                  const status = getExpenseStatus(e.dueDate, e.paidDate, today);
                  return (
                  <tr key={e.id} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 text-ink-soft">{formatDateOnly(e.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${expenseStatusColors[status]}`}
                        title={e.paidDate ? `Pagado el ${formatDate(e.paidDate)}` : undefined}
                      >
                        {expenseStatusLabels[status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink">
                      {e.expenseType.name}
                      {e.isRecurring && (
                        <span className="ml-1.5 rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                          Recurrente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {paymentMethodLabels[e.paymentMethod as PaymentMethod] ?? e.paymentMethod}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{formatMoney(e.amount)}</td>
                    <td className="px-4 py-3 text-ink-soft">{e.note ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{e.createdByUser?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {!e.paidDate && <MarkExpensePaidButton id={e.id} />}
                        <DeleteExpenseButton id={e.id} />
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
