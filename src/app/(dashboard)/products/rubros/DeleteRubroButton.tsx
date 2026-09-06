"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRubro } from "./actions";

export function DeleteRubroButton({ id }: { id: string }) {
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
            if (!confirm("¿Borrar este rubro?")) return;
            const res = await deleteRubro(id);
            if (res.error) {
              setError(res.error);
              return;
            }
            router.refresh();
          })
        }
        className="text-xs font-semibold text-err-ink hover:underline disabled:opacity-50"
      >
        Borrar
      </button>
      {error && <span className="text-xs text-err-ink">{error}</span>}
    </span>
  );
}
