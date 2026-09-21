"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { formatMoney } from "@/lib/format";
import { effectiveMinStock, isLowStock } from "@/lib/stock";
import { calculateMargin, formatMarginPercent } from "@/lib/margin";
import { SortHeader } from "@/components/SortHeader";
import { Combobox } from "@/components/Combobox";
import { MoneyInput } from "@/components/MoneyInput";
import { NumberInput } from "@/components/NumberInput";
import { useSortableList } from "@/lib/useSortableList";
import { updateProductQuickFields, updateProductStock } from "./actions";

type SortableKey = "name" | "supplierName" | "price" | "marginAmount" | "marginPercent" | "cost";

type BranchStock = { branchId: string; branchName: string; stock: number; minStock: number | null };

export type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  characteristics: string;
  supplierId: string | null;
  supplierName: string | null;
  price: number;
  fractionUnit: string | null;
  fractionPrice: number | null;
  marginAmount: number | null;
  marginPercent: number | null;
  marginPercentLabel: string;
  cost: number | null;
  stock: number;
  stocksByBranch: BranchStock[];
  isSeasonal: boolean;
  seasonStart: Date | null;
  soldLabel: string;
};

export function ProductsTable({
  products,
  hasOtherFilters,
  suppliers,
}: {
  products: ProductRow[];
  hasOtherFilters: boolean;
  suppliers: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(normalized) ||
          p.sku?.toLowerCase().includes(normalized),
      )
    : products;
  const suggestions = filtered.slice(0, 8);
  const hasFilters = hasOtherFilters || Boolean(query);

  const { sorted, sortKey, sortDir, toggleSort } = useSortableList<ProductRow, SortableKey>(
    filtered,
    (p, key) => {
      switch (key) {
        case "name":
          return p.name;
        case "supplierName":
          return p.supplierName;
        case "price":
          return p.price;
        case "marginAmount":
          return p.marginAmount;
        case "marginPercent":
          return p.marginPercent;
        case "cost":
          return p.cost;
      }
    },
    "name",
  );

  const supplierOptions = [
    { value: "", label: "Sin proveedor" },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ];

  const branchColumns = products[0]?.stocksByBranch.map((s) => ({ id: s.branchId, name: s.branchName })) ?? [];

  return (
    <>
      <div className="relative max-w-xs">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Buscar producto</span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Ej: Alimento, o escaneá el código de barras"
            className="input"
          />
        </label>
        <ul
          className={`t-dropdown absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-line bg-bg shadow-lg ${
            open && query ? "is-open" : ""
          }`}
        >
          {suggestions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ink-faint">Sin resultados</li>
          ) : (
            suggestions.map((p) => (
              <li
                key={p.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery(p.name);
                  setOpen(false);
                }}
                className="cursor-pointer px-3 py-2 text-sm text-ink hover:bg-accent-soft"
              >
                {p.name}
              </li>
            ))
          )}
        </ul>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-ink-soft">
          {hasFilters
            ? "Ningún producto coincide con estos filtros."
            : "Todavía no hay productos cargados."}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                <SortHeader label="Producto" columnKey="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader
                  label="Proveedor"
                  columnKey="supplierName"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortHeader label="Precio" columnKey="price" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader
                  label="Margen $"
                  columnKey="marginAmount"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortHeader
                  label="Margen %"
                  columnKey="marginPercent"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortHeader label="Costo" columnKey="cost" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                {branchColumns.map((b) => (
                  <th key={b.id} className="px-4 py-3">
                    Stock {b.name}
                  </th>
                ))}
                <th className="px-4 py-3">Ventas</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <EditableProductRow key={p.id} row={p} supplierOptions={supplierOptions} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function EditableProductRow({
  row,
  supplierOptions,
}: {
  row: ProductRow;
  supplierOptions: { value: string; label: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(row.name);
  const [supplierId, setSupplierId] = useState(row.supplierId ?? "");
  const [price, setPrice] = useState<number | "">(row.price);
  const [cost, setCost] = useState<number | "">(row.cost ?? "");
  const [stockByBranch, setStockByBranch] = useState<Record<string, number | "">>(
    Object.fromEntries(row.stocksByBranch.map((s) => [s.branchId, s.stock])),
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const margin = calculateMargin(price === "" ? 0 : price, cost === "" ? null : cost);

  function markDirty() {
    setSaved(false);
    setError(null);
  }

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const quickForm = new FormData();
      quickForm.set("name", name);
      quickForm.set("price", String(price === "" ? 0 : price));
      quickForm.set("cost", cost === "" ? "" : String(cost));
      quickForm.set("supplierId", supplierId);
      const quickRes = await updateProductQuickFields(row.id, {}, quickForm);
      if (quickRes.error) {
        setError(quickRes.error);
        return;
      }

      const stockResults = await Promise.all(
        row.stocksByBranch.map((branch) => {
          const stockForm = new FormData();
          stockForm.set("stock", String(stockByBranch[branch.branchId] === "" ? 0 : stockByBranch[branch.branchId]));
          // Se reenvía el mínimo tal cual estaba — acá solo se edita la cantidad.
          stockForm.set("minStock", branch.minStock == null ? "" : String(branch.minStock));
          return updateProductStock(row.id, branch.branchId, stockForm);
        }),
      );
      const stockError = stockResults.find((r) => r.error);
      if (stockError?.error) {
        setError(stockError.error);
        return;
      }

      setSaved(true);
    });
  }

  return (
    <tr className="border-b border-line-soft last:border-0 align-top">
      <td className="px-4 py-3">
        <div className="flex items-start gap-3">
          {row.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.imageUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-lg border border-line object-cover"
            />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded-lg border border-line bg-surface" />
          )}
          <div className="min-w-[160px]">
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                markDirty();
              }}
              className="input w-full font-medium"
            />
            {row.sku && <p className="mt-1 font-mono text-xs text-ink-faint">{row.sku}</p>}
            {row.characteristics && (
              <p className="text-xs text-ink-faint">{row.characteristics}</p>
            )}
            <Link href={`/products/${row.id}`} className="text-xs font-semibold text-accent hover:underline">
              Ver ficha
            </Link>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Combobox
          value={supplierId}
          onChange={(v) => {
            setSupplierId(v);
            markDirty();
          }}
          options={supplierOptions}
          placeholder="Buscar proveedor…"
          className="w-40"
        />
      </td>
      <td className="px-4 py-3">
        <MoneyInput
          value={price}
          onChange={(v) => {
            setPrice(v);
            markDirty();
          }}
          className="w-28"
        />
        {row.fractionUnit && (
          <p className="mt-1 text-xs text-ink-faint">
            {formatMoney(row.fractionPrice ?? 0)} / {row.fractionUnit}
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-ink-soft">
        {margin ? (
          <span className={margin.amount < 0 ? "font-semibold text-err-ink" : undefined}>
            {formatMoney(margin.amount)}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-4 py-3 text-ink-soft">{formatMarginPercent(margin)}</td>
      <td className="px-4 py-3">
        <MoneyInput
          value={cost}
          onChange={(v) => {
            setCost(v);
            markDirty();
          }}
          className="w-28"
        />
      </td>
      {row.stocksByBranch.map((branch) => {
        const value = stockByBranch[branch.branchId] ?? "";
        const numericValue = value === "" ? 0 : value;
        return (
          <td key={branch.branchId} className="px-4 py-3">
            <NumberInput
              min={0}
              step="any"
              value={value}
              onChange={(v) => {
                setStockByBranch((prev) => ({ ...prev, [branch.branchId]: v }));
                markDirty();
              }}
              className={`w-20 ${
                numericValue <= 0
                  ? "font-semibold text-err-ink"
                  : isLowStock(numericValue, branch.minStock, {
                        isSeasonal: row.isSeasonal,
                        seasonStart: row.seasonStart,
                      })
                    ? "font-semibold text-warn-ink"
                    : ""
              }`}
            />
            <p className="text-[11px] text-ink-faint">mín. {effectiveMinStock(branch.minStock)}</p>
          </td>
        );
      })}
      <td className="px-4 py-3 text-ink-soft">{row.soldLabel}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end gap-1.5">
          {saved && <span className="text-xs font-semibold text-ok-ink">Guardado</span>}
          {error && <span className="max-w-[160px] text-right text-xs font-semibold text-err-ink">{error}</span>}
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="rounded-lg border border-border-input bg-bg px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </td>
    </tr>
  );
}
