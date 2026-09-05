import { db } from "@/lib/db";

// Fecha de la venta confirmada más reciente de un producto, o null si nunca
// se vendió.
export async function getLastSaleDateForProduct(productId: string): Promise<Date | null> {
  const item = await db.saleItem.findFirst({
    where: { productId, sale: { status: "confirmed" } },
    orderBy: { sale: { createdAt: "desc" } },
    select: { sale: { select: { createdAt: true } } },
  });
  return item?.sale.createdAt ?? null;
}

// Última fecha de venta confirmada de cada producto activo, en una sola
// pasada (evita N+1 al armar el informe de productos parados).
export async function getLastSaleDatesByProduct(): Promise<Map<string, Date>> {
  const items = await db.saleItem.findMany({
    where: { sale: { status: "confirmed" } },
    select: { productId: true, sale: { select: { createdAt: true } } },
  });
  const lastSaleByProduct = new Map<string, Date>();
  for (const item of items) {
    const current = lastSaleByProduct.get(item.productId);
    if (!current || item.sale.createdAt > current) {
      lastSaleByProduct.set(item.productId, item.sale.createdAt);
    }
  }
  return lastSaleByProduct;
}
