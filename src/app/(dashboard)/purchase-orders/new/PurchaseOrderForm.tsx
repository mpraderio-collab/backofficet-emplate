"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { createPurchaseOrder, type PurchaseOrderActionState } from "../actions";

type ProductOption = {
  id: string;
  name: string;
  cost: number | null;
  fractionUnit: string | null;
  unitSize: number | null;
};
type SupplierOption = { id: string; name: string };

type LineItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
};

const initialState: PurchaseOrderActionState = {};

export function PurchaseOrderForm({
  suppliers,
  products,
}: {
  suppliers: SupplierOption[];
  products: ProductOption[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createPurchaseOrder, initialState);

  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [items, setItems] = useState<LineItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(products[0]?.cost ?? 0);
  const [addError, setAddError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  function selectProduct(id: string) {
    setSelectedProductId(id);
    const product = products.find((p) => p.id === id);
    setUnitCost(product?.cost ?? 0);
  }

  useEffect(() => {
    if (state.purchaseOrderId) router.push(`/purchase-orders/${state.purchaseOrderId}`);
  }, [state.purchaseOrderId, router]);

  const total = items.reduce((sum, i) => sum + i.unitCost * i.quantity, 0);

  function addItem() {
    setAddError(null);
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    if (quantity < 1) {
      setAddError("La cantidad tiene que ser al menos 1.");
      return;
    }

    setItems((prev) => [
      ...prev,
      { productId: product.id, productName: product.name, quantity, unitCost },
    ]);
    setQuantity(1);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  if (suppliers.length === 0) {
    return (
      <p className="text-ink-soft">
        No hay proveedores cargados todavía. Creá uno primero.
      </p>
    );
  }

  if (products.length === 0) {
    return <p className="text-ink-soft">No hay productos cargados todavía.</p>;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Proveedor</span>
        <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          className="input max-w-sm"
        >
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-xl border border-line bg-bg p-5">
        <p className="text-sm font-semibold text-ink">Agregar producto</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Producto</span>
            <select
              value={selectedProductId}
              onChange={(e) => selectProduct(e.target.value)}
              className="input"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Cantidad</span>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="input w-20"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Costo unitario</span>
            <input
              type="number"
              min={0}
              value={unitCost}
              onChange={(e) => setUnitCost(Number(e.target.value))}
              className="input w-28"
            />
          </label>

          <button
            type="button"
            onClick={addItem}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            + Agregar
          </button>
        </div>
        {selectedProduct?.fractionUnit && (
          <p className="mt-2 text-xs text-ink-faint">
            Se pide por unidad completa (ej: bolsas) — cada una suma{" "}
            {selectedProduct.unitSize ?? 1} {selectedProduct.fractionUnit} de stock al
            recibirse.
          </p>
        )}
        {addError && <p className="mt-2 text-xs text-err-ink">{addError}</p>}
      </div>

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-ink-soft">
              <tr>
                <th className="px-4 py-2 font-medium">Producto</th>
                <th className="px-4 py-2 font-medium">Cant.</th>
                <th className="px-4 py-2 font-medium">Subtotal</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  <td className="px-4 py-2 text-ink">{item.productName}</td>
                  <td className="px-4 py-2 text-ink-soft">{item.quantity}</td>
                  <td className="px-4 py-2 text-ink-soft">
                    {formatMoney(item.unitCost * item.quantity)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-xs font-semibold text-err-ink hover:underline"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-line px-4 py-3 text-right text-sm font-semibold text-ink">
            Total: {formatMoney(total)}
          </div>
        </div>
      )}

      <form
        action={formAction}
        className="flex flex-col gap-4 rounded-xl border border-line bg-bg p-5"
      >
        <input type="hidden" name="supplierId" value={supplierId} />
        <input type="hidden" name="items" value={JSON.stringify(items)} />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Nota (opcional)</span>
          <textarea
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="input"
          />
        </label>

        {state.error && (
          <p className="rounded-lg bg-err-bg px-3 py-2 text-sm text-err-ink">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={items.length === 0 || pending}
          className="w-fit rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white disabled:opacity-40"
        >
          {pending ? "Guardando…" : `Crear pedido — ${formatMoney(total)}`}
        </button>
      </form>
    </div>
  );
}
