import Link from "next/link";
import { db } from "@/lib/db";
import { FilterCombobox } from "@/components/FilterCombobox";
import { PriceListTable, type PriceListRow } from "./PriceListTable";

function distinctValues(products: { [key: string]: unknown }[], key: string): string[] {
  const values = new Set<string>();
  for (const p of products) {
    const value = p[key];
    if (typeof value === "string" && value.trim()) values.add(value);
  }
  return [...values].sort((a, b) => a.localeCompare(b));
}

export default async function PriceListPage(props: PageProps<"/products/price-list">) {
  const searchParams = await props.searchParams;
  const supplierIdParam =
    typeof searchParams?.supplierId === "string" ? searchParams.supplierId : "";
  const brandParam = typeof searchParams?.brand === "string" ? searchParams.brand : "";
  const animalTypeParam =
    typeof searchParams?.animalType === "string" ? searchParams.animalType : "";
  const subrubroIdParam =
    typeof searchParams?.subrubroId === "string" ? searchParams.subrubroId : "";
  const animalWeightParam =
    typeof searchParams?.animalWeight === "string" ? searchParams.animalWeight : "";

  const [products, suppliers, rubros, allProducts, branches, openOrderItems] = await Promise.all([
    db.product.findMany({
      where: {
        status: "active",
        ...(supplierIdParam && { supplierId: supplierIdParam }),
        ...(brandParam && { brand: brandParam }),
        ...(animalTypeParam && { animalType: animalTypeParam }),
        ...(subrubroIdParam && { subrubroId: subrubroIdParam }),
        ...(animalWeightParam && { animalWeight: animalWeightParam }),
      },
      orderBy: { name: "asc" },
      include: {
        stocks: { select: { branchId: true, stock: true } },
      },
    }),
    db.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.rubro.findMany({
      orderBy: { name: "asc" },
      include: { subrubros: { orderBy: { name: "asc" } } },
    }),
    db.product.findMany({
      select: { brand: true, animalType: true, animalWeight: true },
    }),
    db.branch.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.purchaseOrderItem.findMany({
      where: { purchaseOrder: { status: { in: ["pending", "sent"] } } },
      select: { productId: true, purchaseOrder: { select: { status: true } } },
    }),
  ]);

  // "sent" pisa a "pending" si un producto tiene pedidos abiertos en los
  // dos estados — es el más avanzado de los dos, más relevante de mostrar.
  const openOrderStatusByProductId = new Map<string, "pending" | "sent">();
  for (const item of openOrderItems) {
    const status = item.purchaseOrder.status as "pending" | "sent";
    const current = openOrderStatusByProductId.get(item.productId);
    if (!current || status === "sent") openOrderStatusByProductId.set(item.productId, status);
  }

  const brandOptions = distinctValues(allProducts, "brand");
  const animalTypeOptions = distinctValues(allProducts, "animalType");
  const animalWeightOptions = distinctValues(allProducts, "animalWeight");
  const subrubroOptions = rubros.flatMap((r) =>
    r.subrubros.map((s) => ({ value: s.id, label: `${r.name} › ${s.name}` })),
  );

  const hasFilters = Boolean(
    supplierIdParam || brandParam || animalTypeParam || subrubroIdParam || animalWeightParam,
  );

  const rows: PriceListRow[] = products.map((p) => {
    const stockByBranchId = new Map(p.stocks.map((s) => [s.branchId, s.stock]));
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      imageUrl: p.imageUrl,
      price: p.price,
      fractionUnit: p.fractionUnit,
      fractionPrice: p.fractionPrice,
      stockByBranchId: Object.fromEntries(branches.map((b) => [b.id, stockByBranchId.get(b.id) ?? 0])),
      openOrderStatus: openOrderStatusByProductId.get(p.id) ?? null,
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-faint">
            <Link href="/products" className="hover:text-accent">
              Productos
            </Link>{" "}
            / <span className="text-ink">Lista de precios</span>
          </p>
          <h1 className="mt-1 text-2xl font-bold text-ink">Lista de precios</h1>
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
          <span className="text-xs text-ink-soft">Rubro / Subrubro</span>
          <FilterCombobox
            key={subrubroIdParam}
            name="subrubroId"
            defaultValue={subrubroIdParam}
            placeholder="Buscar rubro o subrubro…"
            className="w-48"
            options={[{ value: "", label: "Todos" }, ...subrubroOptions]}
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
            href="/products/price-list"
            className="rounded-lg border border-border-input bg-bg px-3 py-2 text-xs font-semibold text-ink hover:bg-surface"
          >
            Limpiar filtros
          </Link>
        )}
      </form>

      <div className="mt-6">
        <PriceListTable
          products={rows}
          branches={branches}
          hasOtherFilters={hasFilters}
        />
      </div>
    </div>
  );
}
