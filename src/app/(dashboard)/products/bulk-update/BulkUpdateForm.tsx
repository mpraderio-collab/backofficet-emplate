"use client";

import { useActionState, useMemo, useState } from "react";
import { Alert } from "@/components/Alert";
import { Combobox } from "@/components/Combobox";
import { formatMoney } from "@/lib/format";
import { bulkUpdatePrices, type BulkUpdateState } from "./actions";

type ProductOption = {
  id: string;
  name: string;
  price: number;
  cost: number | null;
  fractionUnit: string | null;
  fractionPrice: number | null;
  brand: string | null;
  supplier: { name: string } | null;
};

const initialState: BulkUpdateState = {};

export function BulkUpdateForm({ products }: { products: ProductOption[] }) {
  const [state, formAction, pending] = useActionState(bulkUpdatePrices, initialState);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [percent, setPercent] = useState(0);
  const [brandFilter, setBrandFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");

  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter((b): b is string => Boolean(b)))].sort(),
    [products],
  );
  const suppliers = useMemo(
    () =>
      [...new Set(products.map((p) => p.supplier?.name).filter((s): s is string => Boolean(s)))].sort(),
    [products],
  );

  const visibleProducts = products.filter(
    (p) =>
      (!brandFilter || p.brand === brandFilter) &&
      (!supplierFilter || p.supplier?.name === supplierFilter),
  );

  const allSelected =
    visibleProducts.length > 0 && visibleProducts.every((p) => selected.has(p.id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const p of visibleProducts) next.delete(p.id);
      } else {
        for (const p of visibleProducts) next.add(p.id);
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const factor = 1 + percent / 100;

  const preview = useMemo(
    () =>
      visibleProducts.map((p) => ({
        ...p,
        newPrice: Math.round(p.price * factor),
        newCost: p.cost != null ? Math.round(p.cost * factor) : null,
        newFractionPrice: p.fractionPrice != null ? Math.round(p.fractionPrice * factor) : null,
      })),
    [visibleProducts, factor],
  );

  if (products.length === 0) {
    return <p className="text-ink-soft">No hay productos activos cargados.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {[...selected].map((id) => (
        <input key={id} type="hidden" name="productIds" value={id} />
      ))}

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-line bg-surface p-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Marca</span>
          <Combobox
            value={brandFilter}
            onChange={setBrandFilter}
            placeholder="Buscar marca…"
            className="w-48"
            options={[
              { value: "", label: "Todas las marcas" },
              ...brands.map((b) => ({ value: b, label: b })),
            ]}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Proveedor</span>
          <Combobox
            value={supplierFilter}
            onChange={setSupplierFilter}
            placeholder="Buscar proveedor…"
            className="w-48"
            options={[
              { value: "", label: "Todos los proveedores" },
              ...suppliers.map((s) => ({ value: s, label: s })),
            ]}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            Porcentaje de aumento (usá negativo para bajar precios)
          </span>
          <input
            name="percent"
            type="number"
            step="any"
            value={percent}
            onChange={(e) => setPercent(Number(e.target.value))}
            className="input w-40"
          />
        </label>
        <button
          type="submit"
          disabled={selected.size === 0 || percent === 0 || pending}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          {pending
            ? "Aplicando…"
            : `Aplicar a ${selected.size} producto${selected.size === 1 ? "" : "s"}`}
        </button>
      </div>

      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.updatedCount != null && (
        <Alert variant="success">
          Se actualizaron {state.updatedCount} producto{state.updatedCount === 1 ? "" : "s"}.
        </Alert>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-bg">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4"
                />
              </th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Precio actual</th>
              <th className="px-4 py-3">Precio nuevo</th>
              <th className="px-4 py-3">Costo actual</th>
              <th className="px-4 py-3">Costo nuevo</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((p) => (
              <tr key={p.id} className="border-b border-line-soft last:border-0">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                    className="h-4 w-4"
                  />
                </td>
                <td className="px-4 py-3 text-ink">{p.name}</td>
                <td className="px-4 py-3 text-ink-soft">
                  {formatMoney(p.price)}
                  {p.fractionUnit && p.fractionPrice != null && (
                    <p className="text-xs text-ink-faint">
                      {formatMoney(p.fractionPrice)} / {p.fractionUnit}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-ink">
                  {selected.has(p.id) ? formatMoney(p.newPrice) : "—"}
                  {p.fractionUnit && p.newFractionPrice != null && selected.has(p.id) && (
                    <p className="text-xs text-ink-faint">
                      {formatMoney(p.newFractionPrice)} / {p.fractionUnit}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {p.cost != null ? formatMoney(p.cost) : "—"}
                </td>
                <td className="px-4 py-3 font-medium text-ink">
                  {selected.has(p.id) && p.newCost != null ? formatMoney(p.newCost) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}
