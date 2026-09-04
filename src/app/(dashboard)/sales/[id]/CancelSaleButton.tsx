"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelSale } from "../actions";

export function CancelSaleButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="mt-6">
      {error && <p className="mb-2 text-sm text-err-ink">{error}</p>}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            if (!confirm("¿Cancelar esta venta? Se repone el stock y se anula el cargo en la cuenta corriente.")) {
              return;
            }
            const res = await cancelSale(id);
            if (res.error) {
              setError(res.error);
              return;
            }
            router.refresh();
          })
        }
        className="rounded-lg border border-err-line bg-err-bg px-4 py-2 text-sm font-semibold text-err-ink hover:bg-bg disabled:opacity-50"
      >
        {pending ? "Cancelando…" : "Cancelar venta"}
      </button>
    </div>
  );
}
