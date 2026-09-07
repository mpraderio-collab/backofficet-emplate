"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/Alert";
import { useConfirm } from "@/components/ConfirmDialog";
import { cancelSale } from "../actions";

export function CancelSaleButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { confirm, dialog } = useConfirm();

  return (
    <div className="mt-6">
      {error && <Alert variant="error" className="mb-2">{error}</Alert>}
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          const ok = await confirm(
            "¿Cancelar esta venta? Se repone el stock y se anula el cargo en la cuenta corriente.",
            { confirmLabel: "Cancelar venta" },
          );
          if (!ok) return;
          startTransition(async () => {
            const res = await cancelSale(id);
            if (res.error) {
              setError(res.error);
              return;
            }
            router.refresh();
          });
        }}
        className="rounded-lg border border-err-line bg-err-bg px-4 py-2 text-sm font-semibold text-err-ink hover:bg-bg disabled:opacity-50"
      >
        {pending ? "Cancelando…" : "Cancelar venta"}
      </button>
      {dialog}
    </div>
  );
}
