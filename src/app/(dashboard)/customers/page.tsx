import Link from "next/link";
import { db } from "@/lib/db";
import { getAllCustomerBalances } from "@/lib/ledger";
import { CustomersTable } from "./CustomersTable";

export default async function CustomersPage() {
  const [customers, balances, lastSalesByCustomer] = await Promise.all([
    db.customer.findMany({ orderBy: { name: "asc" } }),
    getAllCustomerBalances(),
    db.sale.groupBy({
      by: ["customerId"],
      where: { status: "confirmed" },
      _max: { createdAt: true },
    }),
  ]);

  const lastSaleByCustomerId = new Map(
    lastSalesByCustomer.map((r) => [r.customerId, r._max.createdAt]),
  );

  const rows = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    balance: balances.get(c.id) ?? 0,
    lastSale: lastSaleByCustomerId.get(c.id) ?? null,
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Clientes</h1>
        <Link
          href="/customers/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover"
        >
          + Nuevo cliente
        </Link>
      </div>

      <CustomersTable customers={rows} />
    </div>
  );
}
