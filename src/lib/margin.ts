export type Margin = { amount: number; percent: number | null };

// Margen en $ (precio - costo) y % de markup sobre el costo — no margen
// sobre el precio, que da un número distinto y confunde (ej: precio $150,
// costo $100 → margen $50, markup 50%, no 33% que sería $50/$150). Con
// costo $0 el % de markup queda indefinido (percent: null) en vez de
// mostrar una división por cero. Mismo criterio que se corrigió en Finder.
export function calculateMargin(price: number, cost: number | null | undefined): Margin | null {
  if (cost == null) return null;
  const amount = price - cost;
  const percent = cost > 0 ? (amount / cost) * 100 : null;
  return { amount, percent };
}

export function formatMarginPercent(margin: Margin | null): string {
  if (!margin || margin.percent == null) return "—";
  return `${margin.percent.toFixed(1)}%`;
}

// Costo estimado de una línea de venta. El costo del producto es siempre
// sobre la unidad completa (ej: la bolsa); para ventas por fracción se
// prorratea entre unitSize (cuántas fracciones tiene 1 unidad completa).
// Devuelve null cuando no hay costo cargado o falta unitSize para prorratear
// — esas líneas quedan afuera del margen en vez de asumir costo cero.
export function estimateItemCost(
  saleUnit: string,
  quantity: number,
  cost: number | null | undefined,
  unitSize: number | null | undefined,
): number | null {
  if (cost == null) return null;
  if (saleUnit === "fraction") {
    if (!unitSize) return null;
    return (cost / unitSize) * quantity;
  }
  return cost * quantity;
}
