"use client";

import { useActionState } from "react";
import { Alert } from "@/components/Alert";
import { Field } from "@/components/Field";
import { MoneyInput } from "@/components/MoneyInput";
import { paymentMethods, paymentMethodLabels } from "@/lib/payment-method";
import type { PaymentActionState } from "../actions";

const initialState: PaymentActionState = {};

export function PaymentForm({
  action,
}: {
  action: (state: PaymentActionState, formData: FormData) => Promise<PaymentActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      {state.error && (
        <Alert variant="error" className="sm:hidden">
          {state.error}
        </Alert>
      )}
      <Field label="Monto del pago">
        <MoneyInput name="amount" required className="sm:w-40" />
      </Field>
      <Field label="Método de pago">
        <select name="paymentMethod" defaultValue="cash" className="input sm:w-40">
          {paymentMethods.map((method) => (
            <option key={method} value={method}>
              {paymentMethodLabels[method]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Nota (opcional)">
        <input name="note" className="input sm:w-56" placeholder="Ej: transferencia" />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="h-fit rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? "Registrando…" : "Registrar pago"}
      </button>
      {state.error && (
        <p className="hidden text-sm text-err-ink sm:block">{state.error}</p>
      )}
    </form>
  );
}
