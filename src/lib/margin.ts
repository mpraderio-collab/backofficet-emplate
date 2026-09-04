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
