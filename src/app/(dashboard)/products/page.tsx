import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney, formatQuantity } from "@/lib/format";
import { calculateMargin, formatMarginPercent } from "@/lib/margin";
import { effectiveMinStock, isLowStock } from "@/lib/stock";
import { ClickableRow } from "@/components/ClickableRow";

function distinctValues(products: { [key: string]: unknown }[], key: string): string[] {
  const values = new Set<string>();
  for (const p of products) {
    const value = p[key];
    if (typeof value === "string" && value.trim()) values.add(value);
  }
  return [...values].sort((a, b) => a.localeCompare(b));
}

export default async function ProductsPage(props: PageProps<"/products">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams?.q === "string" ? searchParams.q : "";
  const supplierIdParam =
    typeof searchParams?.supplierId === "string" ? searchParams.supplierId : "";
  const brandParam = typeof searchParams?.brand === "string" ? searchParams.brand : "";
  const animalTypeParam =
    typeof searchParams?.animalType === "string" ? searchParams.animalType : "";
  const animalSizeParam =
    typeof searchParams?.animalSize === "string" ? searchParams.animalSize : "";
  const animalWeightParam =
    typeof searchParams?.animalWeight === "string" ? searchParams.animalWeight : "";

  const [products, suppliers, allProducts] = await Promise.all([
    db.product.findMany({
      where: {
        ...(q && { name: { contains: q, mode: "insensitive" } }),
        ...(supplierIdParam && { supplierId: supplierIdParam }),
        ...(brandParam && { brand: brandParam }),
        ...(animalTypeParam && { animalType: animalTypeParam }),
        ...(animalSizeParam && { animalSize: animalSizeParam }),
        ...(animalWeightParam && { animalWeight: animalWeightParam }),
      },
      orderBy: { createdAt: "desc" },
      include: { supplier: { select: { name: true } } },
    }),
    db.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({
      select: { brand: true, animalType: true, animalSize: true, animalWeight: true },
    }),
  ]);

  const brandOptions = distinctValues(allProducts, "brand");
  const animalTypeOptions = distinctValues(allProducts, "animalType");
  const animalSizeOptions = distinctValues(allProducts, "animalSize");
  const animalWeightOptions = distinctValues(allProducts, "animalWeight");

  const hasFilters =
    q || supplierIdParam || brandParam || animalTypeParam || animalSizeParam || animalWeightParam;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Productos</h1>
        <div className="flex gap-3">
          <Link
            href="/products/bulk-update"
            className="rounded-lg border border-border-input bg-bg px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
          >
            Actualizar precios por lote
          </Link>
          <Link
            href="/products/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover"
          >
            + Nuevo producto
          </Link>
        </div>
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3" method="get">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Buscar producto</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Ej: Alimento"
            className="input w-64"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Proveedor</span>
          <select name="supplierId" defaultValue={supplierIdParam} className="input">
            <option value="">Todos</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Marca</span>
          <select name="brand" defaultValue={brandParam} className="input">
            <option value="">Todas</option>
            {brandOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Animal</span>
          <select name="animalType" defaultValue={animalTypeParam} className="input">
            <option value="">Todos</option>
            {animalTypeOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Tamaño</span>
          <select name="animalSize" defaultValue={animalSizeParam} className="input">
            <option value="">Todos</option>
            {animalSizeOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Peso</span>
          <select name="animalWeight" defaultValue={animalWeightParam} className="input">
            <option value="">Todos</option>
            {animalWeightOptions.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Filtrar
        </button>
        {hasFilters && (
          <Link
            href="/products"
            className="rounded-lg border border-border-input bg-bg px-3 py-2 text-xs font-semibold text-ink hover:bg-surface"
          >
            Limpiar filtros
          </Link>
        )}
      </form>

      {products.length === 0 ? (
        <p className="mt-6 text-ink-soft">
          {hasFilters
            ? "Ningún producto coincide con estos filtros."
            : "Todavía no hay productos cargados."}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Margen $</th>
                <th className="px-4 py-3">Margen %</th>
                <th className="px-4 py-3">Costo</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const margin = calculateMargin(p.price, p.cost);
                return (
                <ClickableRow
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="border-b border-line-soft last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg border border-line object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-lg border border-line bg-surface" />
                      )}
                      <div>
                        <p className="font-medium text-ink">{p.name}</p>
                        {p.sku && (
                          <p className="font-mono text-xs text-ink-faint">{p.sku}</p>
                        )}
                        {(p.brand || p.animalType || p.animalSize || p.animalWeight) && (
                          <p className="text-xs text-ink-faint">
                            {[p.brand, p.animalType, p.animalSize, p.animalWeight]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {p.supplier?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">
                    {formatMoney(p.price)}
                    {p.fractionUnit && (
                      <p className="text-xs font-normal text-ink-faint">
                        {formatMoney(p.fractionPrice ?? 0)} / {p.fractionUnit}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {margin ? (
                      <span className={margin.amount < 0 ? "font-semibold text-err-ink" : undefined}>
                        {formatMoney(margin.amount)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{formatMarginPercent(margin)}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {p.cost != null ? formatMoney(p.cost) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.stock <= 0
                          ? "font-semibold text-err-ink"
                          : isLowStock(p.stock, p.minStock)
                            ? "font-semibold text-warn-ink"
                            : "text-ink"
                      }
                    >
                      {formatQuantity(p.stock, p.fractionUnit)}
                    </span>
                    <p className="text-xs text-ink-faint">mín. {effectiveMinStock(p.minStock)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                        p.status === "active"
                          ? "bg-ok-bg text-ok-ink"
                          : "bg-line-soft text-ink-faint"
                      }`}
                    >
                      {p.status === "active" ? "Activo" : "Archivado"}
                    </span>
                  </td>
                </ClickableRow>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
