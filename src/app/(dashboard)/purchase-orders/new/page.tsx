import { db } from "@/lib/db";
import { getActiveBranch } from "@/lib/branch";
import { PurchaseOrderForm } from "./PurchaseOrderForm";

export default async function NewPurchaseOrderPage() {
  const { active, branches } = await getActiveBranch();

  if (!active) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ink">Nuevo pedido a proveedor</h1>
        <p className="mt-6 text-ink-soft">
          Todavía no hay ninguna sucursal cargada. Creá una primero desde{" "}
          <a href="/branches" className="font-semibold text-accent hover:underline">
            Sucursales
          </a>
          .
        </p>
      </div>
    );
  }

  const [suppliers, products] = await Promise.all([
    db.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        sku: true,
        cost: true,
        fractionUnit: true,
        unitSize: true,
        brand: true,
        animalType: true,
        animalWeight: true,
        subrubro: { select: { name: true } },
        supplierId: true,
        imageUrl: true,
        isSeasonal: true,
        seasonStart: true,
        stocks: { where: { branchId: active.id }, select: { stock: true, minStock: true } },
      },
    }),
  ]);

  const productsWithStock = products.map((p) => ({
    ...p,
    stock: p.stocks[0]?.stock ?? 0,
    minStock: p.stocks[0]?.minStock ?? null,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Nuevo pedido a proveedor</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Sucursal: <span className="font-semibold text-ink">{active.name}</span>
        {branches.length > 1 && " (cambiala desde el menú lateral)"}
      </p>
      <div className="mt-6">
        <PurchaseOrderForm suppliers={suppliers} products={productsWithStock} />
      </div>
    </div>
  );
}
