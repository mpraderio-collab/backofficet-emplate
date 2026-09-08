import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { calculateMargin } from "@/lib/margin";
import { getLastSaleDateForProduct } from "@/lib/product-sales";
import { toDateInputValue, toDateInputValueUTC } from "@/lib/reports";
import { updateProduct } from "../actions";
import { ProductForm } from "../ProductForm";
import { ProductStockTable } from "./ProductStockTable";
import { ProductDangerZone } from "./ProductDangerZone";

export default async function EditProductPage(
  props: PageProps<"/products/[id]">,
) {
  const { id } = await props.params;
  const [product, suppliers, rubros, lastSaleDate, stocks] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    db.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.rubro.findMany({
      orderBy: { name: "asc" },
      include: { subrubros: { orderBy: { name: "asc" } } },
    }),
    getLastSaleDateForProduct(id),
    db.productStock.findMany({
      where: { productId: id },
      orderBy: { branch: { name: "asc" } },
      include: { branch: { select: { name: true } } },
    }),
  ]);
  if (!product) notFound();

  const boundAction = updateProduct.bind(null, product.id);
  const margin = calculateMargin(product.price, product.cost);
  const registeredAtValue = product.registeredAt
    ? toDateInputValueUTC(product.registeredAt)
    : toDateInputValue(product.createdAt);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">{product.name}</h1>
      {margin && (
        <p className="mt-1 text-sm text-ink-soft">
          Margen actual: <span className="font-semibold text-ink">{formatMoney(margin.amount)}</span>{" "}
          por unidad
          {margin.percent != null && (
            <>
              {" "}
              (<span className="font-semibold text-ink">{margin.percent.toFixed(1)}%</span> de
              markup sobre el costo)
            </>
          )}
        </p>
      )}
      <p className="mt-1 text-sm text-ink-soft">
        Última venta:{" "}
        <span className="font-semibold text-ink">
          {lastSaleDate ? formatDate(lastSaleDate) : "Todavía no se vendió"}
        </span>
      </p>
      {product.priceUpdatedAt && (
        <p className="mt-1 text-sm text-ink-soft">
          Último cambio de precio/costo:{" "}
          <span className="font-semibold text-ink">{formatDate(product.priceUpdatedAt)}</span>
        </p>
      )}
      <div className="mt-6">
        <ProductForm
          action={boundAction}
          suppliers={suppliers}
          rubros={rubros}
          submitLabel="Guardar cambios"
          defaultValues={{
            name: product.name,
            sku: product.sku,
            description: product.description,
            price: product.price,
            cost: product.cost,
            supplierId: product.supplierId,
            fractionUnit: product.fractionUnit,
            unitSize: product.unitSize,
            fractionPrice: product.fractionPrice,
            brand: product.brand,
            animalType: product.animalType,
            animalWeight: product.animalWeight,
            subrubroId: product.subrubroId,
            registeredAt: registeredAtValue,
            imageUrl: product.imageUrl,
          }}
        />
      </div>
      <p className="mt-8 text-sm font-semibold text-ink">Stock por sucursal</p>
      <ProductStockTable
        productId={product.id}
        rows={stocks.map((s) => ({
          branchId: s.branchId,
          branchName: s.branch.name,
          stock: s.stock,
          minStock: s.minStock,
        }))}
      />
      <ProductDangerZone id={product.id} status={product.status} />
    </div>
  );
}
