export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Medianoche UTC del día de hoy (según fecha local) — para comparar contra
// fechas "solo fecha" como Expense.dueDate, que por venir de un <input
// type="date"> (ej: "2026-08-20") se parsean con z.coerce.date() como
// medianoche UTC, no medianoche local. Mismo criterio que formatDateOnly.
export function startOfTodayUTC(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
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

export function endOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

// Iguales a startOfMonth/endOfMonth pero en UTC — para filtrar fechas
// "solo fecha" como Expense.dueDate (medianoche UTC). Usar las versiones
// locales para esto corre el límite del mes unas horas según el huso
// horario del servidor, y puede dejar afuera un vencimiento el día 1.
export function startOfMonthUTC(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1));
}

export function endOfMonthUTC(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999));
}

export function endOfTodayUTC(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999));
}

export function startOfYearUTC(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), 0, 1));
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

// Fecha de hace 6 meses — un producto nunca vendido recién se considera
// "parado" después de este período de gracia desde su fecha de alta, para
// no marcar como parado algo recién cargado.
export function sixMonthsAgo(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
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

// Igual que toDateInputValue, pero en UTC — para fechas "solo fecha"
// guardadas como medianoche UTC (ej: Product.registeredAt, Expense.dueDate),
// que vinieron de z.coerce.date() sobre un string sin hora.
export function toDateInputValueUTC(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
