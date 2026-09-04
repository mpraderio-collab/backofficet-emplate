import { db } from "@/lib/db";
import { PurchaseOrderForm } from "./PurchaseOrderForm";

export default async function NewPurchaseOrderPage() {
  const [suppliers, products] = await Promise.all([
    db.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, cost: true, fractionUnit: true, unitSize: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Nuevo pedido a proveedor</h1>
      <div className="mt-6">
        <PurchaseOrderForm suppliers={suppliers} products={products} />
      </div>
    </div>
  );
}
