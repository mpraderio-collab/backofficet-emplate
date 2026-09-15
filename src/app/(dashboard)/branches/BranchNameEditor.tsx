"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renameBranch } from "./actions";

export function BranchNameEditor({ id, name }: { id: string; name: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!editing) {
    return (
      <span className="flex items-center gap-2">
        <span className="font-semibold text-ink">{name}</span>
        <button
          type="button"
          onClick={() => {
            setValue(name);
            setEditing(true);
          }}
          className="text-xs font-semibold text-accent hover:underline"
        >
          Renombrar
        </button>
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input"
          autoFocus
        />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await renameBranch(id, value);
              if (res.error) {
                setError(res.error);
                return;
              }
              setError(null);
              setEditing(false);
              router.refresh();
            })
          }
          className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {pending ? "…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
          className="shrink-0 text-xs font-semibold text-ink-soft hover:underline"
        >
          Cancelar
        </button>
      </div>
      {error && <p className="text-xs text-err-ink">{error}</p>}
    </div>
  );
}
