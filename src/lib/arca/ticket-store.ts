import { db } from "@/lib/db";

// El ticket de acceso (WSAA) de ARCA vale ~12hs. Si pedimos uno nuevo
// mientras el anterior sigue vigente, ARCA rechaza el pedido — por eso lo
// guardamos acá y lo reutilizamos entre facturas/invocaciones en vez de
// pedir uno por request.
export type StoredTicketData = {
  header: unknown;
  credentials: unknown;
};

// Margen de seguridad para no usar un ticket a punto de vencer.
const EXPIRATION_MARGIN_MS = 5 * 60 * 1000;

export async function getStoredTicket(ticketId: string): Promise<StoredTicketData | null> {
  const row = await db.arcaTicket.findUnique({ where: { id: ticketId } });
  if (!row) return null;
  if (row.expirationDate.getTime() <= Date.now() + EXPIRATION_MARGIN_MS) return null;
  return row.data as StoredTicketData;
}

export async function storeTicket(
  ticketId: string,
  data: StoredTicketData,
  expirationDate: Date,
): Promise<void> {
  await db.arcaTicket.upsert({
    where: { id: ticketId },
    create: { id: ticketId, data: data as object, expirationDate },
    update: { data: data as object, expirationDate },
  });
}
