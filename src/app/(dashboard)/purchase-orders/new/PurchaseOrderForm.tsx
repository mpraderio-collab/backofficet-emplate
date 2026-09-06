"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, formatQuantity } from "@/lib/format";
import { Combobox } from "@/components/Combobox";
import { MoneyInput } from "@/components/MoneyInput";
import { toDateInputValue } from "@/lib/reports";
import { isLowStock } from "@/lib/stock";
import { createPurchaseOrder, type PurchaseOrderActionState } from "../actions";

type ProductOption = {
  id: string;
  name: string;
  cost: number | null;
  fractionUnit: string | null;
  unitSize: number | null;
  brand: string | null;
  animalType: string | null;
  animalWeight: string | null;
  subrubro: { name: string } | null;
  supplierId: string | null;
  stock: number;
  minStock: number | null;
  imageUrl: string | null;
};

function productCharacteristics(product: ProductOption): string {
  return [product.brand, product.animalType, product.subrubro?.name, product.animalWeight]
    .filter(Boolean)
    .join(" · ");
}
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
  action,
  submitLabel = "Crear pedido",
  defaultValues,
}: {
  suppliers: SupplierOption[];
  products: ProductOption[];
  action?: (
    state: PurchaseOrderActionState,
    formData: FormData,
  ) => Promise<PurchaseOrderActionState>;
  submitLabel?: string;
  defaultValues?: {
    supplierId: string;
    orderDate: string;
    note: string;
    items: LineItem[];
  };
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action ?? createPurchaseOrder, initialState);

  const [supplierId, setSupplierId] = useState(defaultValues?.supplierId ?? suppliers[0]?.id ?? "");
  const [items, setItems] = useState<LineItem[]>(defaultValues?.items ?? []);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(products[0]?.cost ?? 0);
  const [addError, setAddError] = useState<string | null>(null);
  const [note, setNote] = useState(defaultValues?.note ?? "");
  const [orderDate, setOrderDate] = useState(
    () => defaultValues?.orderDate ?? toDateInputValue(new Date()),
  );

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const suggestedProducts = products.filter(
    (p) => p.supplierId === supplierId && isLowStock(p.stock, p.minStock),
  );

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
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Proveedor</span>
          <Combobox
            value={supplierId}
            onChange={setSupplierId}
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            placeholder="Buscar proveedor…"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Fecha del pedido</span>
          <input
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            className="input"
          />
        </label>
      </div>

      {suggestedProducts.length > 0 && (
        <div className="rounded-xl border border-line bg-warn-bg p-4">
          <p className="text-sm font-semibold text-warn-ink">
            Productos de este proveedor con stock bajo
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {suggestedProducts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink">
                  {p.name}{" "}
                  <span className="text-ink-faint">
                    ({formatQuantity(p.stock, p.fractionUnit)} disp.)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => selectProduct(p.id)}
                  className="shrink-0 text-xs font-semibold text-accent hover:underline"
                >
                  + Agregar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-line bg-bg p-5">
        <p className="text-sm font-semibold text-ink">Agregar producto</p>
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Producto</span>
            <Combobox
              className="w-full"
              value={selectedProductId}
              onChange={selectProduct}
              options={products.map((p) => ({
                value: p.id,
                label: p.name,
                imageUrl: p.imageUrl,
                description: productCharacteristics(p) || undefined,
                priceLabel: p.cost != null ? formatMoney(p.cost) : undefined,
              }))}
              placeholder="Buscar producto…"
            />
          </label>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">Cantidad</span>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="input w-16"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">Costo unitario</span>
              <MoneyInput
                value={unitCost}
                onChange={(v) => setUnitCost(v === "" ? 0 : v)}
                className="w-24"
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
        </div>
        {selectedProduct && productCharacteristics(selectedProduct) && (
          <p className="mt-2 text-xs text-ink-faint">
            {productCharacteristics(selectedProduct)}
          </p>
        )}
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
        <input type="hidden" name="orderDate" value={orderDate} />

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
          {pending ? "Guardando…" : `${submitLabel} — ${formatMoney(total)}`}
        </button>
      </form>
    </div>
  );
}
