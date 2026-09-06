"use client";

import { useState } from "react";
import { formatMoney, formatQuantity } from "@/lib/format";
import { effectiveMinStock, isLowStock } from "@/lib/stock";
import { ClickableRow } from "@/components/ClickableRow";

export type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  characteristics: string;
  supplierName: string | null;
  price: number;
  fractionUnit: string | null;
  fractionPrice: number | null;
  marginAmount: number | null;
  marginPercentLabel: string;
  cost: number | null;
  stock: number;
  minStock: number | null;
  soldLabel: string;
};

export function ProductsTable({
  products,
  hasOtherFilters,
}: {
  products: ProductRow[];
  hasOtherFilters: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? products.filter((p) => p.name.toLowerCase().includes(normalized))
    : products;
  const suggestions = filtered.slice(0, 8);
  const hasFilters = hasOtherFilters || Boolean(query);

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
            placeholder="Ej: Alimento"
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
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Margen $</th>
                <th className="px-4 py-3">Margen %</th>
                <th className="px-4 py-3">Costo</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Ventas</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <ClickableRow
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="border-b border-line-soft last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg border border-line object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-lg border border-line bg-surface" />
                      )}
                      <div>
                        <p className="font-medium text-ink">{p.name}</p>
                        {p.sku && <p className="font-mono text-xs text-ink-faint">{p.sku}</p>}
                        {p.characteristics && (
                          <p className="text-xs text-ink-faint">{p.characteristics}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{p.supplierName ?? "—"}</td>
                  <td className="px-4 py-3 font-medium text-ink">
                    {formatMoney(p.price)}
                    {p.fractionUnit && (
                      <p className="text-xs font-normal text-ink-faint">
                        {formatMoney(p.fractionPrice ?? 0)} / {p.fractionUnit}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {p.marginAmount != null ? (
                      <span className={p.marginAmount < 0 ? "font-semibold text-err-ink" : undefined}>
                        {formatMoney(p.marginAmount)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{p.marginPercentLabel}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {p.cost != null ? formatMoney(p.cost) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.stock <= 0
                          ? "font-semibold text-err-ink"
                          : isLowStock(p.stock, p.minStock)
                            ? "font-semibold text-warn-ink"
                            : "text-ink"
                      }
                    >
                      {formatQuantity(p.stock, p.fractionUnit)}
                    </span>
                    <p className="text-xs text-ink-faint">mín. {effectiveMinStock(p.minStock)}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{p.soldLabel}</td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
