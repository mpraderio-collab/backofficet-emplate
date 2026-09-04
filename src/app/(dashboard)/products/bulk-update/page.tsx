import Link from "next/link";
import { db } from "@/lib/db";
import { BulkUpdateForm } from "./BulkUpdateForm";

export default async function BulkUpdatePage() {
  const products = await db.product.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      price: true,
      cost: true,
      fractionUnit: true,
      fractionPrice: true,
    },
  });

  return (
    <div>
      <p className="text-sm text-ink-faint">
        <Link href="/products" className="hover:text-accent">
          Productos
        </Link>{" "}
        / <span className="text-ink">Actualizar precios por lote</span>
      </p>
      <h1 className="mt-1 text-2xl font-bold text-ink">Actualizar precios por lote</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Elegí los productos y un porcentaje: se aplica al precio de venta, al
        costo y al precio por fracción (si tienen), todos por igual.
      </p>
      <div className="mt-6">
        <BulkUpdateForm products={products} />
      </div>
    </div>
  );
}
