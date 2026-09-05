import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { paymentMethodLabels, type PaymentMethod } from "@/lib/payment-method";
import {
  endOfToday,
  formatMonth,
  startOfMonth,
  startOfToday,
  startOfYear,
  toDateInputValue,
} from "@/lib/reports";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { DeleteExpenseButton } from "./DeleteExpenseButton";

export default async function ExpensesPage(props: PageProps<"/expenses">) {
  const searchParams = await props.searchParams;
  const fromParam = typeof searchParams?.from === "string" ? searchParams.from : undefined;
  const toParam = typeof searchParams?.to === "string" ? searchParams.to : undefined;

  const from = fromParam ? new Date(`${fromParam}T00:00:00`) : startOfMonth();
  const to = toParam ? new Date(`${toParam}T23:59:59`) : endOfToday();

  const expenses = await db.expense.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: { date: "desc" },
    include: {
      expenseType: { select: { name: true } },
      createdByUser: { select: { name: true } },
    },
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byType = new Map<string, number>();
  for (const e of expenses) {
    byType.set(e.expenseType.name, (byType.get(e.expenseType.name) ?? 0) + e.amount);
  }
  const typeBreakdown = [...byType.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  const quickRanges = [
    { label: "Hoy", from: startOfToday(), to: endOfToday() },
    { label: "Este mes", from: startOfMonth(), to: endOfToday() },
    { label: "Este año", from: startOfYear(), to: endOfToday() },
  ];

  const exportRows: (string | number)[][] = [
    [`Gastos: ${toDateInputValue(from)} a ${toDateInputValue(to)}`],
    [],
    ["Fecha", "Mes", "Tipo", "Método", "Monto", "Nota"],
    ...expenses.map((e) => [
      formatDate(e.date),
      e.referenceMonth ? formatMonth(e.referenceMonth) : "",
      e.expenseType.name,
      paymentMethodLabels[e.paymentMethod as PaymentMethod] ?? e.paymentMethod,
      e.amount,
      e.note ?? "",
    ]),
    [],
    ["Total", "", "", "", totalExpenses, ""],
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
            fileName={`gastos-${toDateInputValue(from)}-a-${toDateInputValue(to)}`}
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
            <input type="date" name="from" defaultValue={toDateInputValue(from)} className="input" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Hasta</span>
            <input type="date" name="to" defaultValue={toDateInputValue(to)} className="input" />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Filtrar
          </button>
        </form>
        <div className="flex gap-2">
          {quickRanges.map((r) => (
            <Link
              key={r.label}
              href={`/expenses?from=${toDateInputValue(r.from)}&to=${toDateInputValue(r.to)}`}
              className="rounded-lg border border-border-input bg-bg px-3 py-2 text-xs font-semibold text-ink hover:bg-surface"
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-bg p-[18px]">
          <p className="text-[13px] text-ink-soft">Total de gastos</p>
          <p className="mt-1 text-2xl font-bold text-ink">{formatMoney(totalExpenses)}</p>
        </div>
        <div className="rounded-xl border border-line bg-bg p-[18px]">
          <p className="text-[13px] text-ink-soft">Cantidad de gastos</p>
          <p className="mt-1 text-2xl font-bold text-ink">{expenses.length}</p>
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
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Mes</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Nota</th>
                  <th className="px-4 py-3">Cargado por</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 text-ink-soft">{formatDate(e.date)}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {e.referenceMonth ? formatMonth(e.referenceMonth) : "—"}
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
                      <DeleteExpenseButton id={e.id} />
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
