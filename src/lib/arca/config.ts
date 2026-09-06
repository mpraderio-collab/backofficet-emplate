// Configuración de ARCA (ex AFIP) leída de variables de entorno. Nada de
// esto se persiste en la base — son credenciales, viven solo en el entorno
// del servidor (Vercel env vars en producción, .env en desarrollo).

export type ArcaConfig = {
  cuit: number;
  cert: string;
  key: string;
  pointOfSale: number;
  production: boolean;
};

// Los certificados en variables de entorno suelen pegarse con "\n" literal
// en vez de saltos de línea reales — los normalizamos acá.
function normalizePem(value: string): string {
  return value.replace(/\\n/g, "\n");
}

export function getArcaConfig(): ArcaConfig | null {
  const cuit = process.env.ARCA_CUIT;
  const cert = process.env.ARCA_CERT;
  const key = process.env.ARCA_KEY;
  const pointOfSale = process.env.ARCA_POINT_OF_SALE;

  if (!cuit || !cert || !key || !pointOfSale) return null;

  return {
    cuit: Number(cuit),
    cert: normalizePem(cert),
    key: normalizePem(key),
    pointOfSale: Number(pointOfSale),
    production: process.env.ARCA_ENV === "produccion",
  };
}

export function isArcaConfigured(): boolean {
  return getArcaConfig() !== null;
}
