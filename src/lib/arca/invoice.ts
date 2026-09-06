import { db } from "@/lib/db";
import { isArcaConfigured } from "./config";
import { getAuthenticatedElectronicBilling } from "./client";
import { resolveDocument } from "./document-type";

const VOUCHER_TYPE_FACTURA_C = 11;
const CONCEPTO_PRODUCTOS = 1;
const CONDICION_IVA_CONSUMIDOR_FINAL = 5;

function todayAsAfipDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

// Emite (o reintenta) la factura ARCA de una venta que se marcó para
// facturar. No lanza: el resultado siempre queda reflejado en ArcaInvoice,
// para no interrumpir el flujo de la venta si ARCA falla o no está
// configurado todavía.
export async function issueArcaInvoiceForSale(saleId: string): Promise<void> {
  const sale = await db.sale.findUnique({
    where: { id: saleId },
    include: { customer: { select: { taxId: true } } },
  });
  if (!sale) return;

  if (!isArcaConfigured()) {
    await db.arcaInvoice.upsert({
      where: { saleId },
      create: {
        saleId,
        status: "error",
        errorMessage: "ARCA no está configurado en el servidor todavía.",
      },
      update: {
        status: "error",
        errorMessage: "ARCA no está configurado en el servidor todavía.",
      },
    });
    return;
  }

  try {
    const { billing, config } = await getAuthenticatedElectronicBilling();
    const { docTipo, docNro } = resolveDocument(sale.customer.taxId);

    const lastVoucher = await billing.getLastVoucher(config.pointOfSale, VOUCHER_TYPE_FACTURA_C);
    const invoiceNumber = lastVoucher.CbteNro + 1;

    const result = await billing.createVoucher({
      CantReg: 1,
      PtoVta: config.pointOfSale,
      CbteTipo: VOUCHER_TYPE_FACTURA_C,
      Concepto: CONCEPTO_PRODUCTOS,
      DocTipo: docTipo,
      DocNro: docNro,
      CbteDesde: invoiceNumber,
      CbteHasta: invoiceNumber,
      CbteFch: todayAsAfipDate(),
      ImpTotal: sale.total,
      ImpTotConc: 0,
      ImpNeto: sale.total,
      ImpOpEx: 0,
      ImpIVA: 0,
      ImpTrib: 0,
      MonId: "PES",
      MonCotiz: 1,
      // @ts-expect-error -- campo requerido por ARCA (RG 5616) que todavía no está tipado en la librería.
      CondicionIVAReceptorId: CONDICION_IVA_CONSUMIDOR_FINAL,
    });

    if (!result.cae) {
      throw new Error("ARCA no devolvió un CAE para el comprobante.");
    }

    await db.arcaInvoice.upsert({
      where: { saleId },
      create: {
        saleId,
        status: "issued",
        voucherType: VOUCHER_TYPE_FACTURA_C,
        pointOfSale: config.pointOfSale,
        invoiceNumber,
        cae: result.cae,
        caeExpiration: parseAfipDate(result.caeFchVto),
        errorMessage: null,
      },
      update: {
        status: "issued",
        voucherType: VOUCHER_TYPE_FACTURA_C,
        pointOfSale: config.pointOfSale,
        invoiceNumber,
        cae: result.cae,
        caeExpiration: parseAfipDate(result.caeFchVto),
        errorMessage: null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido al facturar en ARCA.";
    await db.arcaInvoice.upsert({
      where: { saleId },
      create: { saleId, status: "error", errorMessage: message },
      update: { status: "error", errorMessage: message },
    });
  }
}

function parseAfipDate(value: string | undefined): Date | null {
  if (!value || value.length !== 8) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  return new Date(Date.UTC(year, month - 1, day));
}
