import type { Metadata } from "next";
import { SignageDisplay } from "./SignageDisplay";

export const metadata: Metadata = {
  title: "Cartelería — Backoffice",
};

// Ruta pública a propósito (fuera del grupo (dashboard), sin auth): la TV
// del local abre esta URL directo, sin loguearse. Los datos vienen del
// endpoint público /api/signage, que solo expone lo que ya es público en
// el mostrador (nunca costo ni margen).
export default function SignagePage() {
  return <SignageDisplay />;
}
