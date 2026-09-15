"use client";

import { useState } from "react";
import { Combobox } from "@/components/Combobox";

type Subrubro = { id: string; name: string };
type Rubro = { id: string; name: string; subrubros: Subrubro[] };
type ProductBrandInfo = { brand: string | null; subrubroId: string; rubroId: string };

// Los tres filtros van juntos porque Subrubro depende del Rubro elegido, y
// Marca depende de ambos: al cambiar Rubro (o Subrubro), las opciones de
// abajo se acotan al toque (sin esperar a tocar "Filtrar"), y se limpia
// cualquier valor que ya no pertenezca a la nueva selección. Mismo patrón
// de combobox dependiente que ProductForm usa para el alta de producto.
export function RubroSubrubroFilter({
  rubros,
  products,
  defaultRubroId,
  defaultSubrubroId,
  defaultBrand,
}: {
  rubros: Rubro[];
  products: ProductBrandInfo[];
  defaultRubroId: string;
  defaultSubrubroId: string;
  defaultBrand: string;
}) {
  const [rubroId, setRubroId] = useState(defaultRubroId);
  const [subrubroId, setSubrubroId] = useState(defaultSubrubroId);
  const [brand, setBrand] = useState(defaultBrand);

  const subrubroOptions = rubroId
    ? (rubros.find((r) => r.id === rubroId)?.subrubros ?? [])
    : rubros.flatMap((r) => r.subrubros);

  const matchingProducts = products.filter(
    (p) =>
      (!subrubroId || p.subrubroId === subrubroId) && (!rubroId || p.rubroId === rubroId),
  );
  const brandOptions = [
    ...new Set(
      matchingProducts
        .map((p) => p.brand)
        .filter((b): b is string => Boolean(b && b.trim())),
    ),
  ].sort((a, b) => a.localeCompare(b));

  function handleRubroChange(value: string) {
    setRubroId(value);
    setSubrubroId("");
    setBrand("");
  }

  function handleSubrubroChange(value: string) {
    setSubrubroId(value);
    setBrand("");
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
          onChange={handleSubrubroChange}
          placeholder="Buscar subrubro…"
          className="w-44"
          options={[
            { value: "", label: "Todos" },
            ...subrubroOptions.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-ink-soft">Marca</span>
        <Combobox
          name="brand"
          value={brand}
          onChange={setBrand}
          placeholder="Buscar marca…"
          className="w-40"
          options={[
            { value: "", label: "Todas" },
            ...brandOptions.map((b) => ({ value: b, label: b })),
          ]}
        />
      </label>
    </>
  );
}
