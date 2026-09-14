"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/Alert";
import { createRemito } from "../actions";

type RemitoInfo = {
  number: number;
  status: string;
  branchName: string;
} | null;

export function RemitoSection({
  saleId,
  saleStatus,
  remito,
}: {
  saleId: string;
  saleStatus: string;
  remito: RemitoInfo;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (remito) {
    return (
      <div className="mt-4 max-w-2xl rounded-xl border border-line bg-bg p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">
              Remito {remito.branchName}-{remito.number.toString().padStart(6, "0")}
            </p>
            {remito.status === "voided" && (
              <span className="mt-1 inline-block rounded-md bg-line-soft px-2 py-0.5 text-xs font-semibold text-ink-faint">
                Anulado
              </span>
            )}
          </div>
          <Link
            href={`/sales/${saleId}/remito`}
            target="_blank"
            className="rounded-lg border border-line bg-bg px-3 py-1.5 text-sm font-semibold text-accent hover:bg-line-soft"
          >
            Ver / imprimir
          </Link>
        </div>
      </div>
    );
  }

  if (saleStatus !== "confirmed") return null;

  return (
    <div className="mt-4 max-w-2xl">
      {error && <Alert variant="error" className="mb-2">{error}</Alert>}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await createRemito(saleId);
            if (res.error) {
              setError(res.error);
              return;
            }
            router.refresh();
          })
        }
        className="rounded-lg border border-line bg-bg px-4 py-2 text-sm font-semibold text-ink hover:bg-line-soft disabled:opacity-50"
      >
        {pending ? "Emitiendo…" : "Emitir remito"}
      </button>
    </div>
  );
}
