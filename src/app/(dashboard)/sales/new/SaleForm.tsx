"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, formatQuantity } from "@/lib/format";
import { Combobox } from "@/components/Combobox";
import { paymentMethods, paymentMethodLabels } from "@/lib/payment-method";
import { createSale, type SaleActionState } from "../actions";

type ProductOption = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stock: number;
  fractionUnit: string | null;
  unitSize: number | null;
  fractionPrice: number | null;
};
type CustomerOption = { id: string; name: string; balance: number };

type LineItem = {
  productId: string;
  productName: string;
  saleUnit: "unit" | "fraction";
  quantity: number;
  unitPrice: number;
  stockDelta: number;
};

const initialState: SaleActionState = {};

export function SaleForm({
  customers,
  products,
}: {
  customers: CustomerOption[];
  products: ProductOption[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createSale, initialState);

  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [items, setItems] = useState<LineItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [saleUnit, setSaleUnit] = useState<"unit" | "fraction">("unit");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(products[0]?.price ?? 0);
  const [addError, setAddError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [initialPayment, setInitialPayment] = useState(0);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const isFractionable = Boolean(selectedProduct?.fractionUnit);
  const selectedCustomer = customers.find((c) => c.id === customerId);

  function selectProduct(id: string) {
    setSelectedProductId(id);
    const product = products.find((p) => p.id === id);
    setSaleUnit("unit");
    setUnitPrice(product?.price ?? 0);
  }

  function selectSaleUnit(unit: "unit" | "fraction") {
    setSaleUnit(unit);
    setUnitPrice(unit === "unit" ? (selectedProduct?.price ?? 0) : (selectedProduct?.fractionPrice ?? 0));
  }

  useEffect(() => {
    if (state.saleId) router.push(`/sales/${state.saleId}`);
  }, [state.saleId, router]);

  // Cuánto se descontaría del stock (en unidad base) si se agrega esta línea.
  const unitSizeForDelta = selectedProduct?.unitSize ?? 1;
  const stockDeltaForQuantity =
    saleUnit === "unit" ? quantity * unitSizeForDelta : quantity;

  const alreadyReserved = items
    .filter((i) => i.productId === selectedProductId)
    .reduce((sum, i) => sum + i.stockDelta, 0);
  const remainingStock = (selectedProduct?.stock ?? 0) - alreadyReserved;
  const maxQuantityForSelection =
    saleUnit === "unit" ? remainingStock / unitSizeForDelta : remainingStock;

  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  function addItem() {
    setAddError(null);
    if (!selectedProduct) return;
    if (quantity <= 0) {
      setAddError("La cantidad tiene que ser mayor a 0.");
      return;
    }
    if (stockDeltaForQuantity > remainingStock) {
      setAddError(
        `Solo quedan ${formatQuantity(remainingStock, selectedProduct.fractionUnit)} disponibles.`,
      );
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        saleUnit,
        quantity,
        unitPrice,
        stockDelta: stockDeltaForQuantity,
      },
    ]);
    setQuantity(1);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  if (customers.length === 0) {
    return (
      <p className="text-ink-soft">
        No hay clientes cargados todavía. Creá uno primero para poder
        registrar una venta.
      </p>
    );
  }

  if (products.length === 0) {
    return (
      <p className="text-ink-soft">
        No hay productos activos para vender. Cargá o activá un producto
        primero.
      </p>
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Cliente</span>
        <Combobox
          className="max-w-sm"
          value={customerId}
          onChange={setCustomerId}
          options={customers.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Buscar cliente…"
        />
      </label>

      {selectedCustomer && selectedCustomer.balance > 0 && (
        <p className="rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn-ink">
          {selectedCustomer.name} ya tiene un saldo pendiente de{" "}
          <strong>{formatMoney(selectedCustomer.balance)}</strong> en su cuenta corriente.
        </p>
      )}

      <div className="rounded-xl border border-line bg-bg p-5">
        <p className="text-sm font-semibold text-ink">Agregar producto</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Producto</span>
            <Combobox
              value={selectedProductId}
              onChange={selectProduct}
              options={products.map((p) => ({
                value: p.id,
                label: p.name,
                imageUrl: p.imageUrl,
                description: p.description
                  ? `${p.description} · ${formatQuantity(p.stock, p.fractionUnit)} disp.`
                  : `${formatQuantity(p.stock, p.fractionUnit)} disp.`,
                priceLabel: formatMoney(p.price),
              }))}
              placeholder="Buscar producto…"
            />
          </label>

          {isFractionable && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">Modalidad</span>
              <select
                value={saleUnit}
                onChange={(e) => selectSaleUnit(e.target.value as "unit" | "fraction")}
                className="input"
              >
                <option value="unit">Unidad completa</option>
                <option value="fraction">Por {selectedProduct?.fractionUnit}</option>
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">
              Cantidad {isFractionable && saleUnit === "fraction" ? `(${selectedProduct?.fractionUnit})` : ""}
            </span>
            <input
              type="number"
              min={0}
              step={saleUnit === "fraction" ? "any" : 1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="input w-24"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Precio unitario</span>
            <input
              type="number"
              min={0}
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              className="input w-28"
            />
          </label>

          <button
            type="button"
            onClick={addItem}
            disabled={maxQuantityForSelection <= 0}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            + Agregar
          </button>
        </div>
        {maxQuantityForSelection <= 0 && (
          <p className="mt-2 text-xs text-err-ink">Sin stock disponible.</p>
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
              {items.map((item, i) => {
                const product = products.find((p) => p.id === item.productId);
                return (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="px-4 py-2 text-ink">{item.productName}</td>
                    <td className="px-4 py-2 text-ink-soft">
                      {item.saleUnit === "fraction"
                        ? formatQuantity(item.quantity, product?.fractionUnit)
                        : `${item.quantity} u.`}
                    </td>
                    <td className="px-4 py-2 text-ink-soft">
                      {formatMoney(item.unitPrice * item.quantity)}
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
                );
              })}
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
        <input type="hidden" name="customerId" value={customerId} />
        <input type="hidden" name="items" value={JSON.stringify(items)} />

        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">
              Entrega al momento de la venta (opcional)
            </span>
            <input
              name="initialPayment"
              type="number"
              min={0}
              max={total}
              step={1}
              value={initialPayment}
              onChange={(e) => setInitialPayment(Number(e.target.value))}
              className="input max-w-[200px]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Método de pago</span>
            <select name="initialPaymentMethod" defaultValue="cash" className="input max-w-[160px]">
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {paymentMethodLabels[method]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="-mt-2 text-xs text-ink-soft">
          Si el cliente entrega parte (o todo) del pago ahora, el resto queda pendiente en su
          cuenta corriente.
        </p>

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
          {pending ? "Guardando…" : `Registrar venta — ${formatMoney(total)}`}
        </button>
      </form>
    </div>
  );
}
