"use client";

import { useState, useTransition } from "react";
import { NumberInput } from "@/components/NumberInput";
import { updateProductStock } from "../actions";

type Row = { branchId: string; branchName: string; stock: number; minStock: number | null };

export function ProductStockTable({ productId, rows }: { productId: string; rows: Row[] }) {
  return (
    <div className="mt-6 max-w-2xl overflow-x-auto rounded-xl border border-line bg-bg">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
            <th className="px-4 py-3">Sucursal</th>
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3">Stock mínimo</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <StockRow key={row.branchId} productId={productId} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StockRow({ productId, row }: { productId: string; row: Row }) {
  const [pending, startTransition] = useTransition();
  const [stock, setStock] = useState<number | "">(row.stock);
  const [minStock, setMinStock] = useState<number | "">(row.minStock ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <tr className="border-b border-line-soft last:border-0">
      <td className="px-4 py-2.5 font-medium text-ink">{row.branchName}</td>
      <td className="px-4 py-2.5">
        <NumberInput
          min={0}
          step="any"
          value={stock}
          onChange={(v) => {
            setStock(v);
            setSaved(false);
          }}
          className="w-28"
        />
      </td>
      <td className="px-4 py-2.5">
        <NumberInput
          min={0}
          step="any"
          value={minStock}
          onChange={(v) => {
            setMinStock(v);
            setSaved(false);
          }}
          className="w-28"
        />
      </td>
      <td className="px-4 py-2.5 text-right">
        <div className="flex items-center justify-end gap-2">
          {saved && <span className="text-xs font-semibold text-ok-ink">Guardado</span>}
          {error && <span className="text-xs font-semibold text-err-ink">{error}</span>}
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              setSaved(false);
              startTransition(async () => {
                const formData = new FormData();
                formData.set("stock", String(stock === "" ? 0 : stock));
                formData.set("minStock", minStock === "" ? "" : String(minStock));
                const res = await updateProductStock(productId, row.branchId, formData);
                if (res.error) {
                  setError(res.error);
                  return;
                }
                setSaved(true);
              });
            }}
            className="rounded-lg border border-border-input bg-bg px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </td>
    </tr>
  );
}
