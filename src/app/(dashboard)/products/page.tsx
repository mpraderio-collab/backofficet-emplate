import Link from "next/link";
import { db } from "@/lib/db";
import { formatQuantity } from "@/lib/format";
import { calculateMargin, formatMarginPercent } from "@/lib/margin";
import { FilterCombobox } from "@/components/FilterCombobox";
import { ProductsTable, type ProductRow } from "./ProductsTable";

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
  const supplierIdParam =
    typeof searchParams?.supplierId === "string" ? searchParams.supplierId : "";
  const brandParam = typeof searchParams?.brand === "string" ? searchParams.brand : "";
  const animalTypeParam =
    typeof searchParams?.animalType === "string" ? searchParams.animalType : "";
  const animalSizeParam =
    typeof searchParams?.animalSize === "string" ? searchParams.animalSize : "";
  const animalWeightParam =
    typeof searchParams?.animalWeight === "string" ? searchParams.animalWeight : "";

  const [products, suppliers, allProducts, soldItems] = await Promise.all([
    db.product.findMany({
      where: {
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
    db.saleItem.findMany({
      where: { sale: { status: "confirmed" } },
      select: { productId: true, quantity: true, saleUnit: true },
    }),
  ]);

  const brandOptions = distinctValues(allProducts, "brand");
  const animalTypeOptions = distinctValues(allProducts, "animalType");
  const animalSizeOptions = distinctValues(allProducts, "animalSize");
  const animalWeightOptions = distinctValues(allProducts, "animalWeight");

  const soldByProductId = new Map<string, { unitCount: number; fractionQuantity: number }>();
  for (const item of soldItems) {
    const entry = soldByProductId.get(item.productId) ?? { unitCount: 0, fractionQuantity: 0 };
    if (item.saleUnit === "fraction") entry.fractionQuantity += item.quantity;
    else entry.unitCount += item.quantity;
    soldByProductId.set(item.productId, entry);
  }

  const hasFilters = Boolean(
    supplierIdParam || brandParam || animalTypeParam || animalSizeParam || animalWeightParam,
  );

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
      characteristics: [p.brand, p.animalType, p.animalSize, p.animalWeight]
        .filter(Boolean)
        .join(" · "),
      supplierName: p.supplier?.name ?? null,
      price: p.price,
      fractionUnit: p.fractionUnit,
      fractionPrice: p.fractionPrice,
      marginAmount: margin?.amount ?? null,
      marginPercentLabel: formatMarginPercent(margin),
      cost: p.cost,
      stock: p.stock,
      minStock: p.minStock,
      soldLabel,
    };
  });

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
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Marca</span>
          <FilterCombobox
            key={brandParam}
            name="brand"
            defaultValue={brandParam}
            placeholder="Buscar marca…"
            className="w-40"
            options={[
              { value: "", label: "Todas" },
              ...brandOptions.map((b) => ({ value: b, label: b })),
            ]}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Animal</span>
          <FilterCombobox
            key={animalTypeParam}
            name="animalType"
            defaultValue={animalTypeParam}
            placeholder="Buscar animal…"
            className="w-36"
            options={[
              { value: "", label: "Todos" },
              ...animalTypeOptions.map((a) => ({ value: a, label: a })),
            ]}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Tamaño</span>
          <FilterCombobox
            key={animalSizeParam}
            name="animalSize"
            defaultValue={animalSizeParam}
            placeholder="Buscar tamaño…"
            className="w-36"
            options={[
              { value: "", label: "Todos" },
              ...animalSizeOptions.map((s) => ({ value: s, label: s })),
            ]}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Peso</span>
          <FilterCombobox
            key={animalWeightParam}
            name="animalWeight"
            defaultValue={animalWeightParam}
            placeholder="Buscar peso…"
            className="w-36"
            options={[
              { value: "", label: "Todos" },
              ...animalWeightOptions.map((w) => ({ value: w, label: w })),
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
