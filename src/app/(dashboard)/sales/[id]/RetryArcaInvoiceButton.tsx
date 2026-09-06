"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { retryArcaInvoice } from "../actions";

export function RetryArcaInvoiceButton({ saleId }: { saleId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await retryArcaInvoice(saleId);
            if (res.error) {
              setError(res.error);
              return;
            }
            router.refresh();
          })
        }
        className="text-xs font-semibold text-accent hover:underline disabled:opacity-50"
      >
        {pending ? "Reintentando…" : "Reintentar"}
      </button>
      {error && <span className="text-xs text-err-ink">{error}</span>}
    </span>
  );
}
