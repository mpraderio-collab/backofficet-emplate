import { db } from "@/lib/db";
import { getAllCustomerBalances } from "@/lib/ledger";
import { getActiveBranch } from "@/lib/branch";
import { SaleForm } from "./SaleForm";

export default async function NewSalePage() {
  const { active, branches } = await getActiveBranch();

  if (!active) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ink">Nueva venta</h1>
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

  const [customers, products, customerBalances] = await Promise.all([
    db.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        price: true,
        fractionUnit: true,
        unitSize: true,
        fractionPrice: true,
        sku: true,
        stocks: { where: { branchId: active.id }, select: { stock: true } },
      },
    }),
    getAllCustomerBalances(),
  ]);

  const customersWithBalance = customers.map((c) => ({
    ...c,
    balance: customerBalances.get(c.id) ?? 0,
  }));

  const productsWithStock = products.map((p) => ({
    ...p,
    stock: p.stocks[0]?.stock ?? 0,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Nueva venta</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Sucursal: <span className="font-semibold text-ink">{active.name}</span>
        {branches.length > 1 && " (cambiala desde el menú lateral)"}
      </p>
      <div className="mt-6">
        <SaleForm customers={customersWithBalance} products={productsWithStock} />
      </div>
    </div>
  );
}
