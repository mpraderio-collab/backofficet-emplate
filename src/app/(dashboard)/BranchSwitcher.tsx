"use client";

import { useState, useTransition } from "react";

type BranchOption = { id: string; name: string };

// Select CONTROLADO a propósito: con defaultValue (no controlado), al
// revalidar el layout después de cambiar de sucursal, React no siempre
// reflejaba el nuevo valor en el <select> ya montado y visualmente volvía
// a mostrar la sucursal anterior aunque el cambio sí se haya guardado.
export function BranchSwitcher({
  branches,
  activeBranchId,
  switchBranchAction,
}: {
  branches: BranchOption[];
  activeBranchId: string | null;
  switchBranchAction: (formData: FormData) => Promise<void>;
}) {
  const [value, setValue] = useState(activeBranchId ?? "");
  const [pending, startTransition] = useTransition();

  // Resincroniza si el prop cambia por otra vía (ej. el popup de login
  // confirma una sucursal) — patrón de "derivar durante el render" en vez
  // de un efecto, para no arrastrar un re-render extra.
  const [prevActiveBranchId, setPrevActiveBranchId] = useState(activeBranchId);
  if (activeBranchId !== prevActiveBranchId) {
    setPrevActiveBranchId(activeBranchId);
    setValue(activeBranchId ?? "");
  }

  if (branches.length === 0) return null;

  function handleChange(next: string) {
    setValue(next); // optimista: el select ya muestra la elegida al toque
    const formData = new FormData();
    formData.set("branchId", next);
    startTransition(() => {
      switchBranchAction(formData);
    });
  }

  return (
    <div className="px-3 pb-2">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-white/50">
          Sucursal
        </span>
        <select
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={pending}
          className="w-full rounded-lg border border-white/20 bg-primary px-2 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id} className="text-ink">
              {b.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
