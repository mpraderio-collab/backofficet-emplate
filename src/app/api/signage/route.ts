import { db } from "@/lib/db";

// Pública a propósito (sin auth): la TV del local no puede loguearse, y acá
// solo se exponen datos que ya son públicos en el mostrador (nombre, marca,
// presentación, rubro, precio de venta) — nunca costo ni margen.
export async function GET() {
  const products = await db.product.findMany({
    where: { status: "active" },
    select: {
      id: true,
      name: true,
      brand: true,
      presentation: true,
      price: true,
      fractionUnit: true,
      fractionPrice: true,
      subrubro: { select: { name: true, rubro: { select: { name: true } } } },
    },
    orderBy: { name: "asc" },
  });

  const items = products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    presentation: p.presentation,
    price: p.price,
    fractionUnit: p.fractionUnit,
    fractionPrice: p.fractionPrice,
    rubro: p.subrubro.rubro.name,
    subrubro: p.subrubro.name,
  }));

  return Response.json({ items, generatedAt: new Date().toISOString() });
}
