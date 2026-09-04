"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePurchaseOrderStatus } from "../actions";

const transitions: Record<string, { next: string; label: string; confirm?: string }[]> = {
  pending: [
    { next: "sent", label: "Marcar como enviado" },
    { next: "cancelled", label: "Cancelar pedido" },
  ],
  sent: [
    {
      next: "received",
      label: "Marcar como recibido",
      confirm: "Al recibir el pedido se suma el stock y se genera el cargo en la cuenta corriente del proveedor. ¿Confirmás?",
    },
    { next: "cancelled", label: "Cancelar pedido" },
  ],
  received: [],
  cancelled: [],
};

export function StatusActions({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const options = transitions[status] ?? [];
  if (options.length === 0) return null;

  return (
    <div className="mt-6">
      {error && <p className="mb-2 text-sm text-err-ink">{error}</p>}
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => (
          <button
            key={opt.next}
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                if (opt.confirm && !confirm(opt.confirm)) return;
                const res = await updatePurchaseOrderStatus(id, opt.next);
                if (res.error) {
                  setError(res.error);
                  return;
                }
                router.refresh();
              })
            }
            className={
              opt.next === "cancelled"
                ? "rounded-lg border border-err-line bg-err-bg px-4 py-2 text-sm font-semibold text-err-ink hover:bg-bg disabled:opacity-50"
                : "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
