import Link from "next/link";
import { db } from "@/lib/db";
import { formatQuantity } from "@/lib/format";
import { calculateMargin, formatMarginPercent } from "@/lib/margin";
import { getActiveBranch } from "@/lib/branch";
import { FilterCombobox } from "@/components/FilterCombobox";
import { RubroSubrubroFilter } from "./RubroSubrubroFilter";
import { ProductsTable, type ProductRow } from "./ProductsTable";

export default async function ProductsPage(props: PageProps<"/products">) {
  const searchParams = await props.searchParams;
  const supplierIdParam =
    typeof searchParams?.supplierId === "string" ? searchParams.supplierId : "";
  const brandParam = typeof searchParams?.brand === "string" ? searchParams.brand : "";
  const rubroIdParam = typeof searchParams?.rubroId === "string" ? searchParams.rubroId : "";
  const subrubroIdParam =
    typeof searchParams?.subrubroId === "string" ? searchParams.subrubroId : "";

  const { active } = await getActiveBranch();

  const [products, suppliers, rubros, allProducts, soldItems] = await Promise.all([
    db.product.findMany({
      where: {
        ...(supplierIdParam && { supplierId: supplierIdParam }),
        ...(brandParam && { brand: brandParam }),
        ...(subrubroIdParam && { subrubroId: subrubroIdParam }),
        ...(rubroIdParam && !subrubroIdParam && { subrubro: { rubroId: rubroIdParam } }),
      },
      orderBy: { name: "asc" },
      include: {
        supplier: { select: { name: true } },
        subrubro: { include: { rubro: true } },
        stocks: { where: { branchId: active?.id ?? "" }, select: { stock: true, minStock: true } },
      },
    }),
    db.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.rubro.findMany({
      orderBy: { name: "asc" },
      include: { subrubros: { orderBy: { name: "asc" } } },
    }),
    db.product.findMany({
      select: { brand: true, subrubroId: true, subrubro: { select: { rubroId: true } } },
    }),
    db.saleItem.findMany({
      where: { sale: { status: "confirmed" } },
      select: { productId: true, quantity: true, saleUnit: true },
    }),
  ]);

  const brandFilterProducts = allProducts.map((p) => ({
    brand: p.brand,
    subrubroId: p.subrubroId,
    rubroId: p.subrubro.rubroId,
  }));

  const soldByProductId = new Map<string, { unitCount: number; fractionQuantity: number }>();
  for (const item of soldItems) {
    const entry = soldByProductId.get(item.productId) ?? { unitCount: 0, fractionQuantity: 0 };
    if (item.saleUnit === "fraction") entry.fractionQuantity += item.quantity;
    else entry.unitCount += item.quantity;
    soldByProductId.set(item.productId, entry);
  }

  const hasFilters = Boolean(supplierIdParam || brandParam || rubroIdParam || subrubroIdParam);

  const rows: ProductRow[] = products.map((p) => {
    const margin = calculateMargin(p.price, p.cost);
    const sold = soldByProductId.get(p.id);
    const soldLabel =
      !sold || (sold.unitCount === 0 && sold.fractionQuantity === 0)
        ? "—"
        : [
            sold.unitCount > 0 ? `${sold.unitCount} u.` : "",
            sold.fractionQuantity > 0 ? formatQuantity(sold.fractionQuantity, p.fractionUnit) : "",
          ]
            .filter(Boolean)
            .join(" + ");

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      imageUrl: p.imageUrl,
      characteristics: [p.brand, p.presentation, p.animalType, p.subrubro.name, p.animalWeight]
        .filter(Boolean)
        .join(" · "),
      supplierName: p.supplier?.name ?? null,
      price: p.price,
      fractionUnit: p.fractionUnit,
      fractionPrice: p.fractionPrice,
      marginAmount: margin?.amount ?? null,
      marginPercent: margin?.percent ?? null,
      marginPercentLabel: formatMarginPercent(margin),
      cost: p.cost,
      stock: p.stocks[0]?.stock ?? 0,
      minStock: p.stocks[0]?.minStock ?? null,
      isSeasonal: p.isSeasonal,
      seasonStart: p.seasonStart,
      soldLabel,
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Productos</h1>
          {active && (
            <p className="mt-1 text-sm text-ink-soft">
              Stock de <span className="font-semibold text-ink">{active.name}</span>
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Link
            href="/products/price-list"
            className="rounded-lg border border-border-input bg-bg px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
          >
            Lista de precios
          </Link>
          <Link
            href="/products/rubros"
            className="rounded-lg border border-border-input bg-bg px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
          >
            Rubros y subrubros
          </Link>
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
        <RubroSubrubroFilter
          key={`${rubroIdParam}-${subrubroIdParam}-${brandParam}`}
          rubros={rubros}
          products={brandFilterProducts}
          defaultRubroId={rubroIdParam}
          defaultSubrubroId={subrubroIdParam}
          defaultBrand={brandParam}
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Proveedor</span>
          <FilterCombobox
            key={supplierIdParam}
            name="supplierId"
            defaultValue={supplierIdParam}
            placeholder="Buscar proveedor…"
            className="w-48"
            options={[
              { value: "", label: "Todos" },
              ...suppliers.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
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

      <div className="mt-6">
        <ProductsTable products={rows} hasOtherFilters={hasFilters} />
      </div>
    </div>
  );
}
