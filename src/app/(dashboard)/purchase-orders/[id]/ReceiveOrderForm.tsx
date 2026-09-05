"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { receivePurchaseOrder } from "../actions";

type Item = {
  id: string;
  productName: string;
  productCharacteristics: string;
  quantity: number;
  unitCost: number;
  currentCost: number | null;
};

export function ReceiveOrderForm({ purchaseOrderId, items }: { purchaseOrderId: string; items: Item[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(items.map((item) => [item.id, item.quantity])),
  );
  const [costs, setCosts] = useState<Record<string, number>>(
    Object.fromEntries(items.map((item) => [item.id, item.currentCost ?? item.unitCost])),
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const total = items.reduce((sum, item) => sum + item.unitCost * (quantities[item.id] ?? 0), 0);

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await receivePurchaseOrder(
        purchaseOrderId,
        items.map((item) => ({
          itemId: item.id,
          receivedQuantity: quantities[item.id] ?? 0,
          newCost: costs[item.id],
        })),
      );
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-6 max-w-3xl rounded-xl border border-line bg-bg p-5">
      <p className="text-sm font-semibold text-ink">Recibir pedido</p>
      <p className="mt-1 text-xs text-ink-soft">
        Ajustá la cantidad realmente recibida de cada producto (puede diferir de lo pedido) y, si
        cambió, el costo del producto. Al confirmar se suma al stock, se actualiza el costo y se
        genera el cargo en la cuenta corriente del proveedor por lo efectivamente recibido.
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-ink-soft">
            <tr>
              <th className="px-3 py-2 font-medium">Producto</th>
              <th className="px-3 py-2 font-medium">Pedido</th>
              <th className="px-3 py-2 font-medium">Recibido</th>
              <th className="px-3 py-2 font-medium">Costo del producto</th>
              <th className="px-3 py-2 font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-line-soft last:border-0">
                <td className="px-3 py-2 text-ink">
                  {item.productName}
                  {item.productCharacteristics && (
                    <p className="text-xs font-normal text-ink-faint">
                      {item.productCharacteristics}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2 text-ink-soft">{item.quantity} u.</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={quantities[item.id] ?? 0}
                    onChange={(e) =>
                      setQuantities((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
                    }
                    className="input w-24"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={costs[item.id] ?? 0}
                    onChange={(e) =>
                      setCosts((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
                    }
                    className="input w-28"
                  />
                </td>
                <td className="px-3 py-2 text-ink-soft">
                  {formatMoney(item.unitCost * (quantities[item.id] ?? 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="mt-3 text-sm text-err-ink">{error}</p>}

      <button
        type="button"
        disabled={pending}
        onClick={submit}
        className="mt-4 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? "Confirmando…" : `Confirmar recepción — ${formatMoney(total)}`}
      </button>
    </div>
  );
}
