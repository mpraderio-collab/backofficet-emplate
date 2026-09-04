"use client";

import { useActionState, useState } from "react";
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
    fractionUnit: string | null;
    unitSize: number | null;
    fractionPrice: number | null;
    brand: string | null;
    animalType: string | null;
    animalSize: string | null;
    animalWeight: string | null;
  };
  submitLabel: string;
};

const initialState: ProductActionState = {};

export function ProductForm({ action, suppliers, defaultValues, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [sellsByFraction, setSellsByFraction] = useState(
    Boolean(defaultValues?.fractionUnit),
  );

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

      <div className="grid grid-cols-2 gap-4">
        <Field label="Marca" error={state.fieldErrors?.brand} hint="Opcional">
          <input name="brand" defaultValue={defaultValues?.brand ?? ""} className="input" />
        </Field>
        <Field label="Tipo de animal" error={state.fieldErrors?.animalType} hint='Opcional. Ej: "perro", "gato"'>
          <input
            name="animalType"
            defaultValue={defaultValues?.animalType ?? ""}
            className="input"
          />
        </Field>
        <Field label="Tamaño del animal" error={state.fieldErrors?.animalSize} hint='Opcional. Ej: "pequeño", "grande"'>
          <input
            name="animalSize"
            defaultValue={defaultValues?.animalSize ?? ""}
            className="input"
          />
        </Field>
        <Field label="Peso del animal" error={state.fieldErrors?.animalWeight} hint='Opcional. Ej: "1-10 kg"'>
          <input
            name="animalWeight"
            defaultValue={defaultValues?.animalWeight ?? ""}
            className="input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field
          label={sellsByFraction ? "Precio (unidad completa)" : "Precio de venta"}
          error={state.fieldErrors?.price}
        >
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
        <Field
          label={sellsByFraction ? `Stock (${defaultValues?.fractionUnit || "unidad"})` : "Stock"}
          error={state.fieldErrors?.stock}
        >
          <input
            name="stock"
            type="number"
            min={0}
            step="any"
            defaultValue={defaultValues?.stock ?? 0}
            required
            className="input"
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={sellsByFraction}
          onChange={(e) => setSellsByFraction(e.target.checked)}
          className="h-4 w-4"
        />
        Este producto también se vende por fracción (ej: una bolsa de 20 kg
        que se puede vender por kg)
      </label>

      {sellsByFraction && (
        <div className="grid grid-cols-3 gap-4 rounded-xl border border-line bg-surface p-4">
          <Field
            label="Unidad de fracción"
            error={state.fieldErrors?.fractionUnit}
            hint='Ej: "kg"'
          >
            <input
              name="fractionUnit"
              defaultValue={defaultValues?.fractionUnit ?? ""}
              placeholder="kg"
              className="input"
            />
          </Field>
          <Field
            label="Tamaño de la unidad completa"
            error={state.fieldErrors?.unitSize}
            hint="Ej: 20 (kg por bolsa)"
          >
            <input
              name="unitSize"
              type="number"
              min={0}
              step="any"
              defaultValue={defaultValues?.unitSize ?? ""}
              className="input"
            />
          </Field>
          <Field
            label="Precio por fracción"
            error={state.fieldErrors?.fractionPrice}
            hint="Ej: precio por kg"
          >
            <input
              name="fractionPrice"
              type="number"
              min={0}
              step={1}
              defaultValue={defaultValues?.fractionPrice ?? ""}
              className="input"
            />
          </Field>
        </div>
      )}

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
