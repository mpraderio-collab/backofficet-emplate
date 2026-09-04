"use client";

import { useActionState } from "react";
import { Field } from "@/components/Field";
import type { ProductActionState } from "./actions";

type Supplier = { id: string; name: string };

type Props = {
  action: (
    state: ProductActionState,
    formData: FormData,
  ) => Promise<ProductActionState>;
  suppliers: Supplier[];
  defaultValues?: {
    name: string;
    sku: string | null;
    description: string | null;
    price: number;
    cost: number | null;
    stock: number;
    supplierId: string | null;
  };
  submitLabel: string;
};

const initialState: ProductActionState = {};

export function ProductForm({ action, suppliers, defaultValues, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      {state.error && (
        <p className="rounded-lg bg-err-bg px-3 py-2 text-sm text-err-ink">
          {state.error}
        </p>
      )}

      <Field label="Nombre" error={state.fieldErrors?.name}>
        <input name="name" defaultValue={defaultValues?.name} required className="input" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="SKU / código" error={state.fieldErrors?.sku} hint="Opcional">
          <input
            name="sku"
            defaultValue={defaultValues?.sku ?? ""}
            className="input font-mono"
          />
        </Field>
        <Field label="Proveedor" error={state.fieldErrors?.supplierId} hint="Opcional">
          <select
            name="supplierId"
            defaultValue={defaultValues?.supplierId ?? ""}
            className="input"
          >
            <option value="">Sin proveedor asignado</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Descripción" error={state.fieldErrors?.description} hint="Opcional">
        <textarea
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          rows={3}
          className="input"
        />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Precio de venta" error={state.fieldErrors?.price}>
          <input
            name="price"
            type="number"
            min={0}
            step={1}
            defaultValue={defaultValues?.price}
            required
            className="input"
          />
        </Field>
        <Field
          label="Costo"
          error={state.fieldErrors?.cost}
          hint="Opcional, solo referencia interna"
        >
          <input
            name="cost"
            type="number"
            min={0}
            step={1}
            defaultValue={defaultValues?.cost ?? undefined}
            className="input"
          />
        </Field>
        <Field label="Stock" error={state.fieldErrors?.stock}>
          <input
            name="stock"
            type="number"
            min={0}
            step={1}
            defaultValue={defaultValues?.stock ?? 0}
            required
            className="input"
          />
        </Field>
      </div>

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
