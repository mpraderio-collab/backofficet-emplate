"use client";

import { useState } from "react";
import { Combobox } from "@/components/Combobox";

type Subrubro = { id: string; name: string };
type Rubro = { id: string; name: string; subrubros: Subrubro[] };

// Los dos filtros van juntos porque el Subrubro depende del Rubro elegido:
// al cambiar el Rubro, la lista de Subrubro se acota al toque (sin esperar
// a tocar "Filtrar") y se limpia el Subrubro si no pertenece al nuevo Rubro.
// Mismo patrón que ProductForm usa para el alta de producto.
export function RubroSubrubroFilter({
  rubros,
  defaultRubroId,
  defaultSubrubroId,
}: {
  rubros: Rubro[];
  defaultRubroId: string;
  defaultSubrubroId: string;
}) {
  const [rubroId, setRubroId] = useState(defaultRubroId);
  const [subrubroId, setSubrubroId] = useState(defaultSubrubroId);

  const subrubroOptions = rubroId
    ? (rubros.find((r) => r.id === rubroId)?.subrubros ?? [])
    : rubros.flatMap((r) => r.subrubros);

  function handleRubroChange(value: string) {
    setRubroId(value);
    setSubrubroId("");
  }

  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-ink-soft">Rubro</span>
        <Combobox
          name="rubroId"
          value={rubroId}
          onChange={handleRubroChange}
          placeholder="Buscar rubro…"
          className="w-44"
          options={[
            { value: "", label: "Todos" },
            ...rubros.map((r) => ({ value: r.id, label: r.name })),
          ]}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-ink-soft">Subrubro</span>
        <Combobox
          name="subrubroId"
          value={subrubroId}
          onChange={setSubrubroId}
          placeholder="Buscar subrubro…"
          className="w-44"
          options={[
            { value: "", label: "Todos" },
            ...subrubroOptions.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
      </label>
    </>
  );
}
