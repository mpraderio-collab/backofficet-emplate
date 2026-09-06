"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { Field } from "@/components/Field";
import { Combobox } from "@/components/Combobox";
import { DEFAULT_MIN_STOCK } from "@/lib/stock";
import { calculateMargin } from "@/lib/margin";
import { toDateInputValue } from "@/lib/reports";
import { createRubroInline, createSubrubroInline } from "./rubros/actions";
import type { ProductActionState } from "./actions";

type Supplier = { id: string; name: string };
type Rubro = { id: string; name: string; subrubros: { id: string; name: string }[] };

type Props = {
  action: (
    state: ProductActionState,
    formData: FormData,
  ) => Promise<ProductActionState>;
  suppliers: Supplier[];
  rubros: Rubro[];
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
    animalWeight: string | null;
    subrubroId: string;
    registeredAt?: string;
    imageUrl?: string | null;
  };
  submitLabel: string;
};

const initialState: ProductActionState = {};

export function ProductForm({ action, suppliers, rubros, defaultValues, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [sellsByFraction, setSellsByFraction] = useState(
    Boolean(defaultValues?.fractionUnit),
  );
  const [supplierId, setSupplierId] = useState(defaultValues?.supplierId ?? "");
  const [rubroList, setRubroList] = useState(rubros);
  const defaultRubroId =
    rubroList.find((r) => r.subrubros.some((s) => s.id === defaultValues?.subrubroId))?.id ??
    rubroList[0]?.id ??
    "";
  const [rubroId, setRubroId] = useState(defaultRubroId);
  const [subrubroId, setSubrubroId] = useState(defaultValues?.subrubroId ?? "");
  const subrubroOptions = rubroList.find((r) => r.id === rubroId)?.subrubros ?? [];

  function handleRubroChange(value: string) {
    setRubroId(value);
    const options = rubroList.find((r) => r.id === value)?.subrubros ?? [];
    setSubrubroId(options[0]?.id ?? "");
  }

  const [addingRubro, setAddingRubro] = useState(false);
  const [newRubroName, setNewRubroName] = useState("");
  const [rubroError, setRubroError] = useState<string | null>(null);
  const [rubroPending, startRubroTransition] = useTransition();

  function submitNewRubro() {
    const name = newRubroName.trim();
    if (!name) return;
    startRubroTransition(async () => {
      const res = await createRubroInline(name);
      if ("error" in res) {
        setRubroError(res.error);
        return;
      }
      setRubroList((prev) =>
        [...prev, { id: res.id, name: res.name, subrubros: [] }].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      setRubroId(res.id);
      setSubrubroId("");
      setNewRubroName("");
      setRubroError(null);
      setAddingRubro(false);
    });
  }

  const [addingSubrubro, setAddingSubrubro] = useState(false);
  const [newSubrubroName, setNewSubrubroName] = useState("");
  const [subrubroError, setSubrubroError] = useState<string | null>(null);
  const [subrubroPending, startSubrubroTransition] = useTransition();

  function submitNewSubrubro() {
    const name = newSubrubroName.trim();
    if (!name || !rubroId) return;
    startSubrubroTransition(async () => {
      const res = await createSubrubroInline(rubroId, name);
      if ("error" in res) {
        setSubrubroError(res.error);
        return;
      }
      setRubroList((prev) =>
        prev.map((r) =>
          r.id === rubroId
            ? {
                ...r,
                subrubros: [...r.subrubros, { id: res.id, name: res.name }].sort((a, b) =>
                  a.name.localeCompare(b.name),
                ),
              }
            : r,
        ),
      );
      setSubrubroId(res.id);
      setNewSubrubroName("");
      setSubrubroError(null);
      setAddingSubrubro(false);
    });
  }

  const [registeredAt, setRegisteredAt] = useState(
    () => defaultValues?.registeredAt ?? toDateInputValue(new Date()),
  );
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
        <Field
          label="Fecha de alta"
          error={state.fieldErrors?.registeredAt}
          hint="Cuándo empezó a venderse"
        >
          <input
            name="registeredAt"
            type="date"
            value={registeredAt}
            onChange={(e) => setRegisteredAt(e.target.value)}
            required
            className="input"
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

      <div className="grid grid-cols-3 gap-4">
        <Field label="Marca" error={state.fieldErrors?.brand} hint="Opcional">
          <input name="brand" defaultValue={defaultValues?.brand ?? ""} className="input" />
        </Field>
        <div className="flex flex-col gap-1.5">
          <Field label="Rubro" error={state.fieldErrors?.subrubroId}>
            <Combobox
              value={rubroId}
              onChange={handleRubroChange}
              placeholder="Buscar rubro…"
              options={rubroList.map((r) => ({ value: r.id, label: r.name }))}
            />
          </Field>
          {addingRubro ? (
            <div className="flex gap-2">
              <input
                value={newRubroName}
                onChange={(e) => setNewRubroName(e.target.value)}
                placeholder="Nombre del rubro"
                className="input flex-1"
              />
              <button
                type="button"
                onClick={submitNewRubro}
                disabled={rubroPending}
                className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingRubro(false);
                  setNewRubroName("");
                  setRubroError(null);
                }}
                className="shrink-0 text-xs font-semibold text-ink-soft hover:underline"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingRubro(true)}
              className="w-fit text-xs font-semibold text-accent hover:underline"
            >
              + Agregar rubro
            </button>
          )}
          {rubroError && <p className="text-xs text-err-ink">{rubroError}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Field label="Subrubro" error={state.fieldErrors?.subrubroId}>
            <input type="hidden" name="subrubroId" value={subrubroId} />
            <Combobox
              value={subrubroId}
              onChange={setSubrubroId}
              placeholder="Buscar subrubro…"
              options={subrubroOptions.map((s) => ({ value: s.id, label: s.name }))}
            />
          </Field>
          {addingSubrubro ? (
            <div className="flex gap-2">
              <input
                value={newSubrubroName}
                onChange={(e) => setNewSubrubroName(e.target.value)}
                placeholder="Nombre del subrubro"
                className="input flex-1"
              />
              <button
                type="button"
                onClick={submitNewSubrubro}
                disabled={subrubroPending || !rubroId}
                className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingSubrubro(false);
                  setNewSubrubroName("");
                  setSubrubroError(null);
                }}
                className="shrink-0 text-xs font-semibold text-ink-soft hover:underline"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingSubrubro(true)}
              disabled={!rubroId}
              className="w-fit text-xs font-semibold text-accent hover:underline disabled:opacity-50"
            >
              + Agregar subrubro
            </button>
          )}
          {subrubroError && <p className="text-xs text-err-ink">{subrubroError}</p>}
        </div>
      </div>
      <p className="-mt-3 text-xs text-ink-soft">
        <Link href="/products/rubros" className="text-accent hover:underline">
          Gestionar rubros y subrubros
        </Link>
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Animal" error={state.fieldErrors?.animalType} hint='Opcional. Ej: "perro", "gato"'>
          <input
            name="animalType"
            defaultValue={defaultValues?.animalType ?? ""}
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
