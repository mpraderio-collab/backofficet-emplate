"use client";

import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

// Ordena una lista en memoria por la columna elegida, alternando
// asc/desc al tocar la misma columna de nuevo — usado en las tablas de
// productos, clientes y proveedores, que ya traen todos los datos
// cargados y filtran/buscan en el cliente.
export function useSortableList<T, K extends string>(
  items: T[],
  getValue: (item: T, key: K) => string | number | Date | null,
  defaultKey: K,
) {
  const [sortKey, setSortKey] = useState<K>(defaultKey);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  function toggleSort(key: K) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const va = getValue(a, sortKey);
      const vb = getValue(b, sortKey);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      let cmp: number;
      if (va instanceof Date && vb instanceof Date) cmp = va.getTime() - vb.getTime();
      else if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
      else cmp = String(va).localeCompare(String(vb), "es");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [items, sortKey, sortDir, getValue]);

  return { sorted, sortKey, sortDir, toggleSort };
}
