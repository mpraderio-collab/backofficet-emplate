"use client";

import { useActionState, useState } from "react";
import { Field } from "@/components/Field";
import { Combobox } from "@/components/Combobox";
import { DEFAULT_MIN_STOCK } from "@/lib/stock";
import { calculateMargin } from "@/lib/margin";
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
    minStock: number | null;
    supplierId: string | null;
    fractionUnit: string | null;
    unitSize: number | null;
    fractionPrice: number | null;
    brand: string | null;
    animalType: string | null;
    animalSize: string | null;
    animalWeight: string | null;
    imageUrl?: string | null;
  };
  submitLabel: string;
};

const initialState: ProductActionState = {};

export function ProductForm({ action, suppliers, defaultValues, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [sellsByFraction, setSellsByFraction] = useState(
    Boolean(defaultValues?.fractionUnit),
  );
  const [supplierId, setSupplierId] = useState(defaultValues?.supplierId ?? "");
  const [imagePreview, setImagePreview] = useState(defaultValues?.imageUrl ?? "");
  const [removeImage, setRemoveImage] = useState(false);

  const [cost, setCost] = useState<number | "">(defaultValues?.cost ?? "");
  const [price, setPrice] = useState<number | "">(defaultValues?.price ?? "");
  const [marginPercent, setMarginPercent] = useState<number | "">(() => {
    const percent = calculateMargin(defaultValues?.price ?? 0, defaultValues?.cost ?? null)?.percent;
    return percent != null ? Math.round(percent * 10) / 10 : "";
  });

  function handleCostChange(value: number | "") {
    setCost(value);
    if (value !== "" && value > 0 && marginPercent !== "") {
      setPrice(Math.round(value * (1 + marginPercent / 100)));
    }
  }

  function handleMarginChange(value: number | "") {
    setMarginPercent(value);
    if (cost !== "" && cost > 0 && value !== "") {
      setPrice(Math.round(cost * (1 + value / 100)));
    }
  }

  function handlePriceChange(value: number | "") {
    setPrice(value);
    if (cost !== "" && cost > 0 && value !== "") {
      setMarginPercent(Math.round(((value - cost) / cost) * 1000) / 10);
    }
  }

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

      <Field label="Foto del producto" hint="Opcional. Se usa en los buscadores y listados.">
        <div className="flex items-center gap-4">
          {imagePreview && !removeImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreview}
              alt=""
              className="h-16 w-16 rounded-lg border border-line object-cover"
            />
          )}
          <input
            name="image"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setImagePreview(URL.createObjectURL(file));
                setRemoveImage(false);
              }
            }}
            className="input"
          />
        </div>
        {defaultValues?.imageUrl && (
          <label className="mt-1 flex items-center gap-2 text-xs text-ink-soft">
            <input
              type="checkbox"
              name="removeImage"
              checked={removeImage}
              onChange={(e) => setRemoveImage(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Quitar la imagen actual
          </label>
        )}
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
          <Combobox
            name="supplierId"
            value={supplierId}
            onChange={setSupplierId}
            placeholder="Buscar proveedor…"
            options={[
              { value: "", label: "Sin proveedor asignado" },
              ...suppliers.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
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
        <Field label="Animal" error={state.fieldErrors?.animalType} hint='Opcional. Ej: "perro", "gato"'>
          <input
            name="animalType"
            defaultValue={defaultValues?.animalType ?? ""}
            className="input"
          />
        </Field>
        <Field label="Tamaño de la mordida" error={state.fieldErrors?.animalSize} hint="Opcional">
          <select
            name="animalSize"
            defaultValue={defaultValues?.animalSize ?? ""}
            className="input"
          >
            <option value="">Sin especificar</option>
            <option value="Chica">Chica</option>
            <option value="Grande">Grande</option>
          </select>
        </Field>
        <Field label="Peso del animal" error={state.fieldErrors?.animalWeight} hint='Opcional. Ej: "1-10 kg"'>
          <input
            name="animalWeight"
            defaultValue={defaultValues?.animalWeight ?? ""}
            className="input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Field
          label="Costo"
          error={state.fieldErrors?.cost}
          hint="Opcional, solo referencia interna"
          labelClassName="min-h-10"
        >
          <input
            name="cost"
            type="number"
            min={0}
            step={1}
            value={cost}
            onChange={(e) => handleCostChange(e.target.value === "" ? "" : Number(e.target.value))}
            className="input"
          />
        </Field>
        <Field label="% de margen" hint="Sobre el costo" labelClassName="min-h-10">
          <input
            type="number"
            step="any"
            value={marginPercent}
            onChange={(e) =>
              handleMarginChange(e.target.value === "" ? "" : Number(e.target.value))
            }
            disabled={cost === "" || cost <= 0}
            className="input disabled:opacity-50"
          />
        </Field>
        <Field
          label={sellsByFraction ? "Precio (unidad completa)" : "Precio de venta"}
          error={state.fieldErrors?.price}
          labelClassName="min-h-10"
        >
          <input
            name="price"
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(e) => handlePriceChange(e.target.value === "" ? "" : Number(e.target.value))}
            required
            className="input"
          />
        </Field>
        <Field
          label={sellsByFraction ? `Stock (${defaultValues?.fractionUnit || "unidad"})` : "Stock"}
          error={state.fieldErrors?.stock}
          labelClassName="min-h-10"
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
        <Field
          label="Stock mínimo"
          error={state.fieldErrors?.minStock}
          hint={`Opcional. Default: ${DEFAULT_MIN_STOCK}`}
          labelClassName="min-h-10"
        >
          <input
            name="minStock"
            type="number"
            min={0}
            step="any"
            defaultValue={defaultValues?.minStock ?? ""}
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
            labelClassName="min-h-10"
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
            labelClassName="min-h-10"
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
            labelClassName="min-h-10"
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
