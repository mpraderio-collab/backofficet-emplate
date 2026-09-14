// Datos del emisor para el encabezado del remito impreso — no son
// credenciales, así que no hace falta el mismo cuidado que con ARCA_*, pero
// se leen del entorno igual para no hardcodear datos del negocio en el
// código ni pedir un modelo de configuración solo para esto.
export type RemitoBusinessInfo = {
  name: string;
  address: string;
  taxId: string;
};

const PLACEHOLDER = "Completar en variables de entorno";

export function getRemitoBusinessInfo(): RemitoBusinessInfo {
  return {
    name: process.env.REMITO_BUSINESS_NAME || PLACEHOLDER,
    address: process.env.REMITO_BUSINESS_ADDRESS || PLACEHOLDER,
    taxId: process.env.REMITO_BUSINESS_TAX_ID || PLACEHOLDER,
  };
}
