export type Margin = { amount: number; percent: number };

// Margen sobre el precio de venta: (precio - costo) / precio.
export function calculateMargin(price: number, cost: number | null | undefined): Margin | null {
  if (cost == null) return null;
  const amount = price - cost;
  const percent = price > 0 ? (amount / price) * 100 : 0;
  return { amount, percent };
}

export function formatMarginPercent(margin: Margin | null): string {
  if (!margin) return "—";
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
