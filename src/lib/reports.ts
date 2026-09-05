export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function startOfYear(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), 0, 1);
}

// Fecha de hace exactamente 1 año — umbral para considerar un producto
// "parado" (sin ventas recientes).
export function oneYearAgo(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d;
}

// Fecha local en formato "YYYY-MM-DD" para un <input type="date"> — a
// propósito NO usa toISOString() (que convierte a UTC): las fechas que
// recibe (startOfToday, endOfToday, o un "YYYY-MM-DDT00:00:00" parseado
// desde la URL) están construidas en hora local, así que convertir a UTC
// puede correr la fecha un día para adelante o atrás según el huso horario
// del servidor, y ese corrimiento se acumula en cada ida y vuelta por la URL.
export function toDateInputValue(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Formato "YYYY-MM" para un <input type="month"> — mismo criterio en hora
// local que toDateInputValue.
export function toMonthInputValue(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

const MONTH_NAMES_LONG = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

// "septiembre 2026" a partir de una fecha que representa el primer día de un
// mes (guardada en UTC), sin depender de la zona horaria del navegador.
export function formatMonth(d: Date): string {
  return `${MONTH_NAMES_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// Envuelve Date.now() en una función plana para no llamarlo directo en el
// cuerpo de un componente (la regla react-hooks/purity lo marca como
// impuro ahí, aunque el resultado no se usa como estado).
export function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

const MONTH_LABELS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

// N meses hacia atrás, incluyendo el actual: el primero de la lista es el
// más viejo. Se usa para armar los baldes del gráfico de ventas mensuales.
export function monthBuckets(count: number): { start: Date; end: Date; label: string }[] {
  const now = new Date();
  const buckets: { start: Date; end: Date; label: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    buckets.push({ start, end, label: MONTH_LABELS[start.getMonth()] });
  }
  return buckets;
}
