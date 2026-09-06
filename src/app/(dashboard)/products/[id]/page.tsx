import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { calculateMargin } from "@/lib/margin";
import { getLastSaleDateForProduct } from "@/lib/product-sales";
import { toDateInputValue, toDateInputValueUTC } from "@/lib/reports";
import { updateProduct } from "../actions";
import { ProductForm } from "../ProductForm";
import { ProductDangerZone } from "./ProductDangerZone";

export default async function EditProductPage(
  props: PageProps<"/products/[id]">,
) {
  const { id } = await props.params;
  const [product, suppliers, lastSaleDate] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    db.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    getLastSaleDateForProduct(id),
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
          submitLabel="Guardar cambios"
          defaultValues={{
            name: product.name,
            sku: product.sku,
            description: product.description,
            price: product.price,
            cost: product.cost,
            stock: product.stock,
            minStock: product.minStock,
            supplierId: product.supplierId,
            fractionUnit: product.fractionUnit,
            unitSize: product.unitSize,
            fractionPrice: product.fractionPrice,
            brand: product.brand,
            animalType: product.animalType,
            animalSize: product.animalSize,
            animalWeight: product.animalWeight,
            registeredAt: registeredAtValue,
            imageUrl: product.imageUrl,
          }}
        />
      </div>
      <ProductDangerZone id={product.id} status={product.status} />
    </div>
  );
}
