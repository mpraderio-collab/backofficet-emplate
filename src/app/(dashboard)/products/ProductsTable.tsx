"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
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

type RowApi = { save: () => Promise<{ error?: string }> };

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
  activeBranchId,
}: {
  products: ProductRow[];
  hasOtherFilters: boolean;
  suppliers: { id: string; name: string }[];
  activeBranchId: string | null;
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

  // Habilita/deshabilita la carga de stock por sucursal para TODA la
  // tabla de una — se tilda una vez arriba en vez de fila por fila.
  const [enabledBranches, setEnabledBranches] = useState<Set<string>>(new Set());
  function toggleBranchEnabled(branchId: string) {
    setEnabledBranches((prev) => {
      const next = new Set(prev);
      if (next.has(branchId)) next.delete(branchId);
      else next.add(branchId);
      return next;
    });
  }

  // Un único botón "Guardar cambios" para toda la tabla en vez de uno por
  // fila: cada fila se registra acá (su función de guardado más reciente
  // y si tiene cambios sin guardar) y el botón general solo dispara el
  // guardado de las filas marcadas como modificadas.
  const rowApiRef = useRef(new Map<string, RowApi>());
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
  const [savingAll, startSavingAll] = useTransition();

  function registerRow(id: string, api: RowApi) {
    rowApiRef.current.set(id, api);
  }

  function setRowDirty(id: string, dirty: boolean) {
    setDirtyIds((prev) => {
      if (prev.has(id) === dirty) return prev;
      const next = new Set(prev);
      if (dirty) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function saveAll() {
    const ids = [...dirtyIds];
    if (ids.length === 0) return;
    startSavingAll(async () => {
      const results = await Promise.all(
        ids.map(async (id) => ({ id, res: await rowApiRef.current.get(id)?.save() })),
      );
      const errors: Record<string, string> = {};
      const stillDirty = new Set<string>();
      for (const { id, res } of results) {
        if (res?.error) {
          errors[id] = res.error;
          stillDirty.add(id);
        }
      }
      setSaveErrors(errors);
      setDirtyIds(stillDirty);
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
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

        <button
          type="button"
          disabled={dirtyIds.size === 0 || savingAll}
          onClick={saveAll}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          {savingAll
            ? "Guardando…"
            : dirtyIds.size > 0
              ? `Guardar cambios (${dirtyIds.size})`
              : "Guardar cambios"}
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-ink-soft">
          {hasFilters
            ? "Ningún producto coincide con estos filtros."
            : "Todavía no hay productos cargados."}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-line">
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
                    <div className="flex flex-col gap-1">
                      <span>
                        Stock {b.name}
                        {b.id === activeBranchId && (
                          <span className="ml-1 font-normal normal-case text-ink-faint">(tu sucursal)</span>
                        )}
                      </span>
                      {b.id !== activeBranchId && (
                        <label className="flex items-center gap-1.5 font-normal normal-case tracking-normal text-ink-soft">
                          <input
                            type="checkbox"
                            checked={enabledBranches.has(b.id)}
                            onChange={() => toggleBranchEnabled(b.id)}
                            className="h-3.5 w-3.5"
                          />
                          Habilitar carga
                        </label>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3">Ventas</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <EditableProductRow
                  key={p.id}
                  row={p}
                  supplierOptions={supplierOptions}
                  activeBranchId={activeBranchId}
                  enabledBranches={enabledBranches}
                  registerRow={registerRow}
                  onDirtyChange={setRowDirty}
                  externalError={saveErrors[p.id]}
                />
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
  activeBranchId,
  enabledBranches,
  registerRow,
  onDirtyChange,
  externalError,
}: {
  row: ProductRow;
  supplierOptions: { value: string; label: string }[];
  activeBranchId: string | null;
  enabledBranches: Set<string>;
  registerRow: (id: string, api: RowApi) => void;
  onDirtyChange: (id: string, dirty: boolean) => void;
  externalError?: string;
}) {
  const [name, setName] = useState(row.name);
  const [supplierId, setSupplierId] = useState(row.supplierId ?? "");
  const [price, setPrice] = useState<number | "">(row.price);
  const [cost, setCost] = useState<number | "">(row.cost ?? "");
  const [stockByBranch, setStockByBranch] = useState<Record<string, number | "">>(
    Object.fromEntries(row.stocksByBranch.map((s) => [s.branchId, s.stock])),
  );
  const [saved, setSaved] = useState(false);

  // Último estado guardado con éxito — el "modificado" se compara contra
  // esto, no contra los props originales, para que la fila deje de
  // figurar como pendiente apenas se guarda (sin esperar a un refresh).
  const [baseline, setBaseline] = useState({
    name: row.name,
    supplierId: row.supplierId ?? "",
    price: row.price as number | "",
    cost: (row.cost ?? "") as number | "",
    stockByBranch: Object.fromEntries(row.stocksByBranch.map((s) => [s.branchId, s.stock])) as Record<
      string,
      number | ""
    >,
  });

  const isDirty =
    name !== baseline.name ||
    supplierId !== baseline.supplierId ||
    price !== baseline.price ||
    cost !== baseline.cost ||
    row.stocksByBranch.some((b) => (stockByBranch[b.branchId] ?? "") !== baseline.stockByBranch[b.branchId]);

  useEffect(() => {
    onDirtyChange(row.id, isDirty);
  });

  function markDirty() {
    setSaved(false);
  }

  async function save(): Promise<{ error?: string }> {
    setSaved(false);
    const quickForm = new FormData();
    quickForm.set("name", name);
    quickForm.set("price", String(price === "" ? 0 : price));
    quickForm.set("cost", cost === "" ? "" : String(cost));
    quickForm.set("supplierId", supplierId);
    const quickRes = await updateProductQuickFields(row.id, {}, quickForm);
    if (quickRes.error) return { error: quickRes.error };

    const editableBranches = row.stocksByBranch.filter(
      (branch) => branch.branchId === activeBranchId || enabledBranches.has(branch.branchId),
    );
    const stockResults = await Promise.all(
      editableBranches.map((branch) => {
        const stockForm = new FormData();
        stockForm.set("stock", String(stockByBranch[branch.branchId] === "" ? 0 : stockByBranch[branch.branchId]));
        // Se reenvía el mínimo tal cual estaba — acá solo se edita la cantidad.
        stockForm.set("minStock", branch.minStock == null ? "" : String(branch.minStock));
        return updateProductStock(row.id, branch.branchId, stockForm);
      }),
    );
    const stockError = stockResults.find((r) => r.error);
    if (stockError?.error) return { error: stockError.error };

    setBaseline({ name, supplierId, price, cost, stockByBranch: { ...stockByBranch } });
    setSaved(true);
    return {};
  }

  // Se re-registra en cada render para que el botón general siempre
  // dispare la versión más reciente de `save` (con los valores tipeados).
  useEffect(() => {
    registerRow(row.id, { save });
  });

  const margin = calculateMargin(price === "" ? 0 : price, cost === "" ? null : cost);
  const error = externalError;

  return (
    <tr className={`border-b border-line-soft last:border-0 align-top ${isDirty ? "bg-warn-bg/40" : ""}`}>
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
        const isActiveBranch = branch.branchId === activeBranchId;
        const isEnabled = isActiveBranch || enabledBranches.has(branch.branchId);
        return (
          <td key={branch.branchId} className="px-4 py-3">
            <NumberInput
              min={0}
              step="any"
              value={value}
              disabled={!isEnabled}
              onChange={(v) => {
                setStockByBranch((prev) => ({ ...prev, [branch.branchId]: v }));
                markDirty();
              }}
              className={`w-20 ${isEnabled ? "" : "!bg-line"} ${
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
        {error ? (
          <span className="text-xs font-semibold text-err-ink">{error}</span>
        ) : saved ? (
          <span className="text-xs font-semibold text-ok-ink">Guardado</span>
        ) : isDirty ? (
          <span className="text-xs font-semibold text-warn-ink">Sin guardar</span>
        ) : (
          <span className="text-xs text-ink-faint">—</span>
        )}
      </td>
    </tr>
  );
}
