import Link from "next/link";
import { db } from "@/lib/db";
import { ExpenseTypeForm } from "../ExpenseTypeForm";
import { DeleteExpenseTypeButton } from "../DeleteExpenseTypeButton";
import { ExpenseForm } from "../ExpenseForm";

export default async function NewExpensePage() {
  const [expenseTypes, recurringExpenses, expenseCountByType] = await Promise.all([
    db.expenseType.findMany({ orderBy: { name: "asc" } }),
    db.expense.findMany({
      where: { isRecurring: true },
      orderBy: { dueDate: "desc" },
      include: { expenseType: { select: { name: true } } },
    }),
    db.expense.groupBy({ by: ["expenseTypeId"], _count: { _all: true } }),
  ]);

  // Solo la ocurrencia recurrente más reciente de cada tipo, como sugerencia
  // para "cargar de nuevo este mes".
  const recurringByType = new Map<string, (typeof recurringExpenses)[number]>();
  for (const e of recurringExpenses) {
    if (!recurringByType.has(e.expenseTypeId)) recurringByType.set(e.expenseTypeId, e);
  }
  const recurringSuggestions = [...recurringByType.values()];

  const expenseCountByTypeId = new Map(
    expenseCountByType.map((r) => [r.expenseTypeId, r._count._all]),
  );

  return (
    <div>
      <p className="text-sm text-ink-faint">
        <Link href="/expenses" className="hover:text-accent">
          Gastos
        </Link>{" "}
        / <span className="text-ink">Nuevo gasto</span>
      </p>
      <h1 className="mt-1 text-2xl font-bold text-ink">Nuevo gasto</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-ink">Registrar gasto</p>
          <div className="mt-3">
            {expenseTypes.length === 0 ? (
              <p className="text-sm text-ink-soft">
                Creá un tipo de gasto primero (a la derecha) para poder registrar uno.
              </p>
            ) : (
              <ExpenseForm
                expenseTypes={expenseTypes.map((t) => ({ id: t.id, name: t.name }))}
                recurringSuggestions={recurringSuggestions.map((e) => ({
                  expenseTypeId: e.expenseTypeId,
                  expenseTypeName: e.expenseType.name,
                  amount: e.amount,
                  paymentMethod: e.paymentMethod,
                }))}
              />
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink">Tipos de gasto</p>
          <div className="mt-3 flex flex-col gap-3">
            <ExpenseTypeForm />
            {expenseTypes.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-line bg-bg">
                <table className="w-full text-left text-sm">
                  <tbody>
                    {expenseTypes.map((t) => (
                      <tr key={t.id} className="border-b border-line-soft last:border-0">
                        <td className="px-4 py-2.5 text-ink">{t.name}</td>
                        <td className="px-4 py-2.5 text-right">
                          {(expenseCountByTypeId.get(t.id) ?? 0) === 0 && (
                            <DeleteExpenseTypeButton id={t.id} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
