"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { Field } from "@/components/Field";
import { formatMoney } from "@/lib/format";
import { toDateInputValue } from "@/lib/reports";
import { paymentMethods, paymentMethodLabels } from "@/lib/payment-method";
import { createExpense, type ExpenseActionState } from "./actions";

type ExpenseTypeOption = { id: string; name: string };
type RecurringSuggestion = {
  expenseTypeId: string;
  expenseTypeName: string;
  amount: number;
  paymentMethod: string;
};

const initialState: ExpenseActionState = {};

export function ExpenseForm({
  expenseTypes,
  recurringSuggestions,
}: {
  expenseTypes: ExpenseTypeOption[];
  recurringSuggestions: RecurringSuggestion[];
}) {
  const [state, formAction, pending] = useActionState(createExpense, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const [expenseTypeId, setExpenseTypeId] = useState(expenseTypes[0]?.id ?? "");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState(() => toDateInputValue(new Date()));
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [isRecurring, setIsRecurring] = useState(false);
  const [note, setNote] = useState("");

  // Al terminar un submit exitoso, limpiar el formulario — ajustando el
  // estado durante el render (comparando la referencia de `state`, que
  // cambia en cada acción) en vez de un efecto, para no encadenar renders.
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (!state.error) {
      setAmount("");
      setNote("");
      setIsRecurring(false);
      setDate(toDateInputValue(new Date()));
    }
  }

  useEffect(() => {
    if (!pending && !state.error && state !== initialState) formRef.current?.reset();
  }, [pending, state]);

  function applySuggestion(s: RecurringSuggestion) {
    setExpenseTypeId(s.expenseTypeId);
    setAmount(s.amount);
    setPaymentMethod(s.paymentMethod);
    setIsRecurring(true);
    setDate(toDateInputValue(new Date()));
  }

  return (
    <div className="flex flex-col gap-4">
      {recurringSuggestions.length > 0 && (
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs font-semibold text-ink-soft">Gastos recurrentes</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {recurringSuggestions.map((s) => (
              <li key={s.expenseTypeId} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink">
                  {s.expenseTypeName}{" "}
                  <span className="text-ink-faint">({formatMoney(s.amount)} la última vez)</span>
                </span>
                <button
                  type="button"
                  onClick={() => applySuggestion(s)}
                  className="shrink-0 text-xs font-semibold text-accent hover:underline"
                >
                  Cargar este mes
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo de gasto" error={state.fieldErrors?.expenseTypeId}>
            <select
              name="expenseTypeId"
              value={expenseTypeId}
              onChange={(e) => setExpenseTypeId(e.target.value)}
              className="input"
            >
              {expenseTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Monto" error={state.fieldErrors?.amount}>
            <input
              name="amount"
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              required
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha" error={state.fieldErrors?.date}>
            <input
              name="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="input"
            />
          </Field>
          <Field label="Método de pago" error={state.fieldErrors?.paymentMethod}>
            <select
              name="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="input"
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {paymentMethodLabels[method]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="isRecurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4 w-4"
          />
          Es un gasto recurrente (se repite todos los meses, ej: alquiler, luz)
        </label>

        <Field label="Nota (opcional)" error={state.fieldErrors?.note}>
          <input name="note" value={note} onChange={(e) => setNote(e.target.value)} className="input" />
        </Field>

        {state.error && (
          <p className="rounded-lg bg-err-bg px-3 py-2 text-sm text-err-ink">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? "Registrando…" : "Registrar gasto"}
        </button>
      </form>
    </div>
  );
}
