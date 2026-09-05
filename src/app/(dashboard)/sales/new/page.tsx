import { db } from "@/lib/db";
import { getAllCustomerBalances } from "@/lib/ledger";
import { SaleForm } from "./SaleForm";

export default async function NewSalePage() {
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
        stock: true,
        fractionUnit: true,
        unitSize: true,
        fractionPrice: true,
      },
    }),
    getAllCustomerBalances(),
  ]);

  const customersWithBalance = customers.map((c) => ({
    ...c,
    balance: customerBalances.get(c.id) ?? 0,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Nueva venta</h1>
      <div className="mt-6">
        <SaleForm customers={customersWithBalance} products={products} />
      </div>
    </div>
  );
}
