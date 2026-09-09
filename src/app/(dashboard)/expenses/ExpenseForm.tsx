"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { Alert } from "@/components/Alert";
import { Field } from "@/components/Field";
import { Combobox } from "@/components/Combobox";
import { MoneyInput } from "@/components/MoneyInput";
import { formatMoney } from "@/lib/format";
import { toDateInputValue } from "@/lib/reports";
import { paymentMethods, paymentMethodLabels } from "@/lib/payment-method";
import { createExpense, type ExpenseActionState } from "./actions";

type ExpenseTypeOption = {
  id: string;
  name: string;
  isRecurring: boolean;
  hasSecondDueDate: boolean;
};
type BranchOption = { id: string; name: string };
type RecurringSuggestion = {
  expenseTypeId: string;
  expenseTypeName: string;
  amount: number;
  paymentMethod: string;
};

const initialState: ExpenseActionState = {};

export function ExpenseForm({
  expenseTypes,
  branches,
  activeBranchId,
  recurringSuggestions,
}: {
  expenseTypes: ExpenseTypeOption[];
  branches: BranchOption[];
  activeBranchId: string;
  recurringSuggestions: RecurringSuggestion[];
}) {
  const [state, formAction, pending] = useActionState(createExpense, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const [expenseTypeId, setExpenseTypeId] = useState(expenseTypes[0]?.id ?? "");
  const [branchId, setBranchId] = useState(activeBranchId);
  const [amount, setAmount] = useState<number | "">("");
  const [dueDate, setDueDate] = useState(() => toDateInputValue(new Date()));
  const [secondDueDate, setSecondDueDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paidDate, setPaidDate] = useState("");
  const [note, setNote] = useState("");

  const selectedType = expenseTypes.find((t) => t.id === expenseTypeId);

  // Al terminar un submit exitoso, limpiar el formulario — ajustando el
  // estado durante el render (comparando la referencia de `state`, que
  // cambia en cada acción) en vez de un efecto, para no encadenar renders.
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (!state.error) {
      setAmount("");
      setNote("");
      setSecondDueDate("");
      setPaidDate("");
      setDueDate(toDateInputValue(new Date()));
      setBranchId(activeBranchId);
    }
  }

  useEffect(() => {
    if (!pending && !state.error && state !== initialState) formRef.current?.reset();
  }, [pending, state]);

  function applySuggestion(s: RecurringSuggestion) {
    setExpenseTypeId(s.expenseTypeId);
    setAmount(s.amount);
    setPaymentMethod(s.paymentMethod);
    setDueDate(toDateInputValue(new Date()));
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
          <Field
            label="Tipo de gasto"
            error={state.fieldErrors?.expenseTypeId}
            hint={selectedType?.isRecurring ? "Recurrente — se repite todos los meses" : undefined}
          >
            <Combobox
              name="expenseTypeId"
              value={expenseTypeId}
              onChange={setExpenseTypeId}
              placeholder="Buscar tipo de gasto…"
              options={expenseTypes.map((t) => ({ value: t.id, label: t.name }))}
            />
          </Field>
          <Field label="Monto" error={state.fieldErrors?.amount}>
            <MoneyInput name="amount" value={amount} onChange={setAmount} required />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Sucursal"
            error={state.fieldErrors?.branchId}
            hint="O compartido entre todas"
          >
            <select
              name="branchId"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="input"
            >
              <option value="">Todas las sucursales</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha de vencimiento" error={state.fieldErrors?.dueDate}>
            <input
              name="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="input"
            />
          </Field>
          {selectedType?.hasSecondDueDate && (
            <Field
              label="Vencimiento con recargo"
              error={state.fieldErrors?.secondDueDate}
              hint="Opcional"
            >
              <input
                name="secondDueDate"
                type="date"
                value={secondDueDate}
                onChange={(e) => setSecondDueDate(e.target.value)}
                className="input"
              />
            </Field>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          <Field
            label="Fecha de pago"
            error={state.fieldErrors?.paidDate}
            hint="Opcional — dejalo vacío si todavía no se pagó"
          >
            <input
              name="paidDate"
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field label="Nota (opcional)" error={state.fieldErrors?.note}>
          <input name="note" value={note} onChange={(e) => setNote(e.target.value)} className="input" />
        </Field>

        {state.error && <Alert variant="error">{state.error}</Alert>}

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
