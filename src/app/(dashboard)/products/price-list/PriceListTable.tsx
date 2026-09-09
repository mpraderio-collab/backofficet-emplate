"use client";

import { useState } from "react";
import { formatMoney, formatQuantity } from "@/lib/format";
import { Alert } from "@/components/Alert";
import { purchaseOrderStatusColors, purchaseOrderStatusLabels } from "@/lib/purchase-order-status";

export type PriceListRow = {
  id: string;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  price: number;
  fractionUnit: string | null;
  fractionPrice: number | null;
  stockByBranchId: Record<string, number>;
  openOrderStatus: "pending" | "sent" | null;
};

function OpenOrderBadge({ status }: { status: "pending" | "sent" | null }) {
  if (!status) return null;
  return (
    <span
      className={`ml-1.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${purchaseOrderStatusColors[status]}`}
    >
      Pedido {purchaseOrderStatusLabels[status].toLowerCase()}
    </span>
  );
}

type BranchOption = { id: string; name: string };

export function PriceListTable({
  products,
  branches,
  hasOtherFilters,
}: {
  products: PriceListRow[];
  branches: BranchOption[];
  hasOtherFilters: boolean;
}) {
  const [query, setQuery] = useState("");
  const [barcode, setBarcode] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<PriceListRow | null>(null);

  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(normalized) || p.sku?.toLowerCase().includes(normalized),
      )
    : products;
  const hasFilters = hasOtherFilters || Boolean(query);

  function scanBarcode() {
    const code = barcode.trim();
    if (!code) return;
    const product = products.find((p) => p.sku?.toLowerCase() === code.toLowerCase());
    if (!product) {
      setScanError(`No se encontró ningún producto con el código "${code}".`);
      setScannedProduct(null);
      setBarcode("");
      return;
    }
    setScanError(null);
    setScannedProduct(product);
    setBarcode("");
  }

  return (
    <>
      <div className="flex flex-wrap items-start gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Código de barras</span>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              scanBarcode();
            }}
            placeholder="Escaneá el código para ver el precio"
            className="input w-72"
            autoFocus
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Buscar producto</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: Alimento"
            className="input w-64"
          />
        </label>
      </div>

      {scanError && (
        <Alert variant="error" className="mt-3 max-w-md">
          {scanError}
        </Alert>
      )}

      {scannedProduct && (
        <div className="mt-4 max-w-xl rounded-xl border border-accent bg-accent-soft p-5">
          <div className="flex items-center gap-4">
            {scannedProduct.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={scannedProduct.imageUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg border border-line object-cover"
              />
            ) : (
              <div className="h-16 w-16 shrink-0 rounded-lg border border-line bg-bg" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold text-ink">
                {scannedProduct.name}
                <OpenOrderBadge status={scannedProduct.openOrderStatus} />
              </p>
              {scannedProduct.sku && (
                <p className="font-mono text-xs text-ink-faint">{scannedProduct.sku}</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-3xl font-bold text-accent">{formatMoney(scannedProduct.price)}</p>
              {scannedProduct.fractionUnit && (
                <p className="text-sm text-ink-soft">
                  {formatMoney(scannedProduct.fractionPrice ?? 0)} / {scannedProduct.fractionUnit}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 border-t border-accent/20 pt-3">
            {branches.map((b) => (
              <p key={b.id} className="text-sm text-ink-soft">
                {b.name}:{" "}
                <span className="font-semibold text-ink">
                  {formatQuantity(scannedProduct.stockByBranchId[b.id] ?? 0, scannedProduct.fractionUnit)}
                </span>
              </p>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="mt-6 text-ink-soft">
          {hasFilters
            ? "Ningún producto coincide con estos filtros."
            : "Todavía no hay productos cargados."}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Precio</th>
                {branches.map((b) => (
                  <th key={b.id} className="px-4 py-3">
                    {b.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-line-soft last:border-0 ${
                    scannedProduct?.id === p.id ? "bg-accent-soft" : ""
                  }`}
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
                        <p className="font-medium text-ink">
                          {p.name}
                          <OpenOrderBadge status={p.openOrderStatus} />
                        </p>
                        {p.sku && <p className="font-mono text-xs text-ink-faint">{p.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">
                    {formatMoney(p.price)}
                    {p.fractionUnit && (
                      <p className="text-xs font-normal text-ink-faint">
                        {formatMoney(p.fractionPrice ?? 0)} / {p.fractionUnit}
                      </p>
                    )}
                  </td>
                  {branches.map((b) => (
                    <td key={b.id} className="px-4 py-3 text-ink-soft">
                      {formatQuantity(p.stockByBranchId[b.id] ?? 0, p.fractionUnit)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
