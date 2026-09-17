"use client";

import { useState, useTransition } from "react";

type BranchOption = { id: string; name: string };

export function BranchPromptModal({
  branches,
  activeBranchId,
  confirmAction,
  dismissAction,
}: {
  branches: BranchOption[];
  activeBranchId: string | null;
  confirmAction: (formData: FormData) => Promise<void>;
  dismissAction: () => Promise<void>;
}) {
  const [selected, setSelected] = useState(activeBranchId ?? branches[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    if (!selected) return;
    const formData = new FormData();
    formData.set("branchId", selected);
    startTransition(() => confirmAction(formData));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-bg p-6 shadow-xl">
        <h2 className="text-lg font-bold text-ink">¿A qué sucursal ingresás?</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Vas a ver el stock y cargar todo para esta sucursal — la podés cambiar
          después desde el menú.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {branches.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelected(b.id)}
              disabled={pending}
              className={`rounded-lg border px-4 py-2.5 text-left text-sm font-semibold transition-colors disabled:opacity-50 ${
                selected === b.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-line text-ink hover:bg-surface"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => startTransition(() => dismissAction())}
            disabled={pending}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-soft hover:underline disabled:opacity-50"
          >
            Ahora no
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending || !selected}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
