// Resuelve tipo/número de documento del comprador para el comprobante ARCA
// a partir del CUIT/DNI cargado en el cliente. Sin dato, se factura a
// Consumidor Final (99 / 0) — válido para Factura C por montos moderados.
export function resolveDocument(taxId: string | null): { docTipo: number; docNro: number } {
  const digits = (taxId ?? "").replace(/\D/g, "");

  if (digits.length === 11) return { docTipo: 80, docNro: Number(digits) }; // CUIT
  if (digits.length >= 7 && digits.length <= 8) return { docTipo: 96, docNro: Number(digits) }; // DNI

  return { docTipo: 99, docNro: 0 }; // Consumidor Final
}
