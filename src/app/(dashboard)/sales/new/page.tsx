import { db } from "@/lib/db";
import { SaleForm } from "./SaleForm";

export default async function NewSalePage() {
  const [customers, products] = await Promise.all([
    db.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        fractionUnit: true,
        unitSize: true,
        fractionPrice: true,
      },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Nueva venta</h1>
      <div className="mt-6">
        <SaleForm customers={customers} products={products} />
      </div>
    </div>
  );
}
