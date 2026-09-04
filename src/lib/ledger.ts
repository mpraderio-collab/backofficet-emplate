import { db } from "@/lib/db";

export async function getCustomerBalance(customerId: string): Promise<number> {
  const rows = await db.customerLedgerEntry.groupBy({
    by: ["type"],
    where: { customerId },
    _sum: { amount: true },
  });
  const charge = rows.find((r) => r.type === "charge")?._sum.amount ?? 0;
  const payment = rows.find((r) => r.type === "payment")?._sum.amount ?? 0;
  return charge - payment;
}

export async function getSupplierBalance(supplierId: string): Promise<number> {
  const rows = await db.supplierLedgerEntry.groupBy({
    by: ["type"],
    where: { supplierId },
    _sum: { amount: true },
  });
  const charge = rows.find((r) => r.type === "charge")?._sum.amount ?? 0;
  const payment = rows.find((r) => r.type === "payment")?._sum.amount ?? 0;
  return charge - payment;
}

// Balances de todos los clientes/proveedores en una sola pasada — evita N+1
// al listarlos (una query por entidad sería demasiado lenta con muchas filas).
export async function getAllCustomerBalances(): Promise<Map<string, number>> {
  const rows = await db.customerLedgerEntry.groupBy({
    by: ["customerId", "type"],
    _sum: { amount: true },
  });
  const balances = new Map<string, number>();
  for (const row of rows) {
    const current = balances.get(row.customerId) ?? 0;
    const amount = row._sum.amount ?? 0;
    balances.set(row.customerId, row.type === "charge" ? current + amount : current - amount);
  }
  return balances;
}

export async function getAllSupplierBalances(): Promise<Map<string, number>> {
  const rows = await db.supplierLedgerEntry.groupBy({
    by: ["supplierId", "type"],
    _sum: { amount: true },
  });
  const balances = new Map<string, number>();
  for (const row of rows) {
    const current = balances.get(row.supplierId) ?? 0;
    const amount = row._sum.amount ?? 0;
    balances.set(row.supplierId, row.type === "charge" ? current + amount : current - amount);
  }
  return balances;
}
