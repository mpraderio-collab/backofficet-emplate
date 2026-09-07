"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/Alert";
import { useConfirm } from "@/components/ConfirmDialog";
import { archiveProduct, canDeleteProduct, deleteProduct, restoreProduct } from "../actions";

export function ProductDangerZone({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { confirm, dialog } = useConfirm();

  return (
    <div className="mt-10 max-w-2xl rounded-xl border border-err-line bg-err-bg p-5">
      <p className="text-sm font-semibold text-err-ink">Zona de eliminación</p>
      <p className="mt-1 text-xs text-ink-soft">
        Un producto archivado no aparece para nuevas ventas ni pedidos, pero
        conserva su historial.
      </p>
      {error && (
        <Alert variant="error" className="mt-2">
          {error}
        </Alert>
      )}
      <div className="mt-3 flex flex-wrap gap-3">
        {status === "active" ? (
          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              const ok = await confirm(
                "¿Archivar este producto? Deja de aparecer para ventas y pedidos nuevos.",
                { confirmLabel: "Archivar", danger: false },
              );
              if (!ok) return;
              startTransition(async () => {
                await archiveProduct(id);
                router.refresh();
              });
            }}
            className="rounded-lg border border-border-input bg-bg px-4 py-2 text-sm font-semibold text-ink hover:bg-surface disabled:opacity-50"
          >
            Archivar producto
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await restoreProduct(id);
                router.refresh();
              })
            }
            className="rounded-lg border border-border-input bg-bg px-4 py-2 text-sm font-semibold text-ink hover:bg-surface disabled:opacity-50"
          >
            Reactivar producto
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            setError(null);
            const check = await canDeleteProduct(id);
            if (check.error) {
              setError(check.error);
              return;
            }
            const ok = await confirm("¿Borrar este producto definitivamente?", {
              confirmLabel: "Borrar",
            });
            if (!ok) return;
            startTransition(async () => {
              const res = await deleteProduct(id);
              if (res.error) {
                setError(res.error);
                return;
              }
              router.push("/products");
            });
          }}
          className="rounded-lg border border-err-line bg-bg px-4 py-2 text-sm font-semibold text-err-ink hover:bg-err-bg disabled:opacity-50"
        >
          Borrar definitivamente
        </button>
      </div>
      {dialog}
    </div>
  );
}
