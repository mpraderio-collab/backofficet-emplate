import { Afip } from "afip.ts";
import { getArcaConfig } from "./config";
import { getStoredTicket, storeTicket } from "./ticket-store";

// Un solo servicio de ARCA usado hoy: facturación electrónica (wsfe).
function ticketId(production: boolean): string {
  return `wsfe-${production ? "produccion" : "homologacion"}`;
}

export async function getAuthenticatedElectronicBilling() {
  const config = getArcaConfig();
  if (!config) throw new Error("ARCA no está configurado en el servidor.");

  const id = ticketId(config.production);
  const stored = await getStoredTicket(id);

  const afip = new Afip({
    cert: config.cert,
    key: config.key,
    cuit: config.cuit,
    production: config.production,
    ...(stored ? { credentials: stored as { header: never; credentials: never } } : {}),
  });

  const billing = afip.electronicBillingService;

  if (!stored) {
    const ticket = await billing.login();
    await storeTicket(
      id,
      { header: ticket.getHeaders(), credentials: ticket.getCredentials() },
      ticket.getExpiration(),
    );
    billing.setCredentials({ header: ticket.getHeaders(), credentials: ticket.getCredentials() });
  }

  return { billing, config };
}
