// Si el producto no tiene un stock mínimo cargado, se usa este valor por
// defecto para decidir cuándo avisar que conviene reponer.
export const DEFAULT_MIN_STOCK = 5;

export function effectiveMinStock(minStock: number | null | undefined): number {
  return minStock ?? DEFAULT_MIN_STOCK;
}

export type SeasonalInfo = {
  isSeasonal: boolean;
  seasonStart: Date | null;
};

// Próxima fecha en que cae mes/día de `monthDay` a partir de `now` (si ya
// pasó este año, cae el año que viene) — el año de `monthDay` no importa.
function nextOccurrence(monthDay: Date, now: Date): Date {
  const month = monthDay.getUTCMonth();
  const day = monthDay.getUTCDate();
  const candidate = new Date(Date.UTC(now.getUTCFullYear(), month, day));
  if (candidate < now) candidate.setUTCFullYear(candidate.getUTCFullYear() + 1);
  return candidate;
}

// Un producto de temporada solo se considera "por reponer" en la ventana de
// los dos meses previos al comienzo de la temporada — fuera de esa ventana
// (incluida la temporada en sí) el stock bajo no importa, así que no avisa.
function isWithinTwoMonthsBeforeSeason(seasonStart: Date, now: Date): boolean {
  const next = nextOccurrence(seasonStart, now);
  const twoMonthsBefore = new Date(next);
  twoMonthsBefore.setUTCMonth(twoMonthsBefore.getUTCMonth() - 2);
  return now >= twoMonthsBefore && now <= next;
}

export function isLowStock(
  stock: number,
  minStock: number | null | undefined,
  seasonal?: SeasonalInfo,
  now: Date = new Date(),
): boolean {
  const low = stock <= effectiveMinStock(minStock);
  if (!low) return false;
  if (!seasonal?.isSeasonal || !seasonal.seasonStart) return low;
  return isWithinTwoMonthsBeforeSeason(seasonal.seasonStart, now);
}
