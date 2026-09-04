"use client";

import { useActionState } from "react";
import { Field } from "@/components/Field";
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
        <p className="rounded-lg bg-err-bg px-3 py-2 text-sm text-err-ink sm:hidden">
          {state.error}
        </p>
      )}
      <Field label="Monto del pago">
        <input
          name="amount"
          type="number"
          min={1}
          step={1}
          required
          className="input sm:w-40"
        />
      </Field>
      <Field label="Nota" hint="Opcional">
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
