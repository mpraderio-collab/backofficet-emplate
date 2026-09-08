import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatQuantity } from "@/lib/format";
import { daysSince, oneYearAgo, sixMonthsAgo } from "@/lib/reports";
import { getLastSaleDatesByProduct } from "@/lib/product-sales";
import { getActiveBranch } from "@/lib/branch";
import { FilterCombobox } from "@/components/FilterCombobox";
import { BarChart } from "@/components/charts/BarChart";

export default async function StaleProductsReportPage(
  props: PageProps<"/reports/stale-products">,
) {
  const searchParams = await props.searchParams;
  const { active, branches } = await getActiveBranch();

  if (!active) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ink">Productos parados</h1>
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

  const branchIdParam =
    typeof searchParams?.branchId === "string" ? searchParams.branchId : active.id;

  const [activeProducts, lastSaleByProduct] = await Promise.all([
    db.product.findMany({
      where: { status: "active" },
      select: {
        id: true,
        name: true,
        fractionUnit: true,
        registeredAt: true,
        createdAt: true,
        stocks: { where: { branchId: branchIdParam }, select: { stock: true } },
      },
    }),
    getLastSaleDatesByProduct(branchIdParam),
  ]);

  const staleThreshold = oneYearAgo();
  const graceThreshold = sixMonthsAgo();
  const staleProducts = activeProducts
    .map((p) => ({
      ...p,
      stock: p.stocks[0]?.stock ?? 0,
      lastSaleDate: lastSaleByProduct.get(p.id) ?? null,
    }))
    .filter((p) =>
      p.lastSaleDate
        ? p.lastSaleDate < staleThreshold
        : (p.registeredAt ?? p.createdAt) < graceThreshold,
    )
    .sort((a, b) => {
      if (!a.lastSaleDate && !b.lastSaleDate) return a.name.localeCompare(b.name);
      if (!a.lastSaleDate) return -1;
      if (!b.lastSaleDate) return 1;
      return a.lastSaleDate.getTime() - b.lastSaleDate.getTime();
    });

  const topStale = staleProducts.slice(0, 8).map((p) => ({
    label: p.name.length > 14 ? `${p.name.slice(0, 13)}…` : p.name,
    value: p.lastSaleDate ? daysSince(p.lastSaleDate) : daysSince(p.registeredAt ?? p.createdAt),
  }));

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
        Productos activos sin ventas en esta sucursal en el último año, o que nunca se vendieron
        ahí y ya pasaron 6 meses desde su fecha de alta.
      </p>

      <form className="mt-4 flex flex-wrap items-end gap-3" method="get">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Sucursal</span>
          <FilterCombobox
            key={branchIdParam}
            name="branchId"
            defaultValue={branchIdParam}
            placeholder="Buscar sucursal…"
            className="w-48"
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Filtrar
        </button>
      </form>

      {staleProducts.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">
          No hay productos parados: todos tuvieron ventas en el último año.
        </p>
      ) : (
        <div className="mt-6 rounded-xl border border-line bg-bg p-5">
          <p className="text-sm font-semibold text-ink">
            Días sin vender — {topStale.length < staleProducts.length ? "los más viejos" : "todos"}
          </p>
          <BarChart data={topStale} formatValue={(v) => `${v} d`} />
        </div>
      )}
      {staleProducts.length > 0 && (
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
