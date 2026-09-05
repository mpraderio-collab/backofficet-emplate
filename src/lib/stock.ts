// Si el producto no tiene un stock mínimo cargado, se usa este valor por
// defecto para decidir cuándo avisar que conviene reponer.
export const DEFAULT_MIN_STOCK = 5;

export function effectiveMinStock(minStock: number | null | undefined): number {
  return minStock ?? DEFAULT_MIN_STOCK;
}

export function isLowStock(stock: number, minStock: number | null | undefined): boolean {
  return stock <= effectiveMinStock(minStock);
}
