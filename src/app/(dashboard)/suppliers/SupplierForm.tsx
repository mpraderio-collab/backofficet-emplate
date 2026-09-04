"use client";

import { useActionState } from "react";
import { Field } from "@/components/Field";
import type { SupplierActionState } from "./actions";

type Props = {
  action: (
    state: SupplierActionState,
    formData: FormData,
  ) => Promise<SupplierActionState>;
  defaultValues?: {
    name: string;
    taxId: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  submitLabel: string;
};

const initialState: SupplierActionState = {};

export function SupplierForm({ action, defaultValues, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      {state.error && (
        <p className="rounded-lg bg-err-bg px-3 py-2 text-sm text-err-ink">{state.error}</p>
      )}

      <Field label="Nombre / razón social" error={state.fieldErrors?.name}>
        <input name="name" defaultValue={defaultValues?.name} required className="input" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="CUIT" error={state.fieldErrors?.taxId} hint="Opcional">
          <input name="taxId" defaultValue={defaultValues?.taxId ?? ""} className="input" />
        </Field>
        <Field label="Teléfono" error={state.fieldErrors?.phone} hint="Opcional">
          <input name="phone" defaultValue={defaultValues?.phone ?? ""} className="input" />
        </Field>
      </div>

      <Field label="Email" error={state.fieldErrors?.email} hint="Opcional">
        <input
          name="email"
          type="email"
          defaultValue={defaultValues?.email ?? ""}
          className="input"
        />
      </Field>

      <Field label="Dirección" error={state.fieldErrors?.address} hint="Opcional">
        <input name="address" defaultValue={defaultValues?.address ?? ""} className="input" />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-fit rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
