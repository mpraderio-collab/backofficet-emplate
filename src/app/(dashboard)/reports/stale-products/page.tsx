import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatQuantity } from "@/lib/format";
import { oneYearAgo } from "@/lib/reports";
import { getLastSaleDatesByProduct } from "@/lib/product-sales";

export default async function StaleProductsReportPage() {
  const [activeProducts, lastSaleByProduct] = await Promise.all([
    db.product.findMany({
      where: { status: "active" },
      select: { id: true, name: true, stock: true, fractionUnit: true },
    }),
    getLastSaleDatesByProduct(),
  ]);

  const staleThreshold = oneYearAgo();
  const staleProducts = activeProducts
    .map((p) => ({ ...p, lastSaleDate: lastSaleByProduct.get(p.id) ?? null }))
    .filter((p) => !p.lastSaleDate || p.lastSaleDate < staleThreshold)
    .sort((a, b) => {
      if (!a.lastSaleDate && !b.lastSaleDate) return a.name.localeCompare(b.name);
      if (!a.lastSaleDate) return -1;
      if (!b.lastSaleDate) return 1;
      return a.lastSaleDate.getTime() - b.lastSaleDate.getTime();
    });

  return (
    <div>
      <p className="text-sm text-ink-faint">
        <Link href="/reports" className="hover:text-accent">
          Informes
        </Link>{" "}
        / <span className="text-ink">Productos parados</span>
      </p>
      <h1 className="mt-1 text-2xl font-bold text-ink">Productos parados</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Productos activos sin ventas en el último año, o que nunca se vendieron.
      </p>

      {staleProducts.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">
          No hay productos parados: todos tuvieron ventas en el último año.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Última venta</th>
                <th className="px-4 py-3">Stock actual</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {staleProducts.map((p) => (
                <tr key={p.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3 text-ink">{p.name}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {p.lastSaleDate ? formatDate(p.lastSaleDate) : "Nunca se vendió"}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {formatQuantity(p.stock, p.fractionUnit)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/products/${p.id}`}
                      className="font-semibold text-accent hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
