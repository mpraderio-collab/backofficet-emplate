import Link from "next/link";
import { db } from "@/lib/db";
import { getAllSupplierBalances } from "@/lib/ledger";
import { SuppliersTable } from "./SuppliersTable";

export default async function SuppliersPage() {
  const [suppliers, balances, lastOrdersBySupplier] = await Promise.all([
    db.supplier.findMany({ orderBy: { name: "asc" } }),
    getAllSupplierBalances(),
    db.purchaseOrder.groupBy({
      by: ["supplierId"],
      _max: { orderDate: true },
    }),
  ]);

  const lastOrderBySupplierId = new Map(
    lastOrdersBySupplier.map((r) => [r.supplierId, r._max.orderDate]),
  );

  const rows = suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    email: s.email,
    balance: balances.get(s.id) ?? 0,
    lastOrder: lastOrderBySupplierId.get(s.id) ?? null,
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Proveedores</h1>
        <Link
          href="/suppliers/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover"
        >
          + Nuevo proveedor
        </Link>
      </div>

      <SuppliersTable suppliers={rows} />
    </div>
  );
}
