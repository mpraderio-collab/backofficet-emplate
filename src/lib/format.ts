export function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatQuantity(value: number, unit?: string | null): string {
  const rounded = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
  }).format(value);
  return unit ? `${rounded} ${unit}` : `${rounded} u.`;
}

export function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

// Para fechas sin hora (ej: la fecha de un pedido, elegida en un <input
// type="date">): se guardan como medianoche UTC, así que hay que mostrarlas
// también en UTC — si no, según la zona horaria del servidor o del navegador
// pueden aparecer un día antes o después de lo que se eligió.
export function formatDateOnly(value: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}
