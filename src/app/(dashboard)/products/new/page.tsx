import { db } from "@/lib/db";
import { createProduct } from "../actions";
import { ProductForm } from "../ProductForm";

export default async function NewProductPage() {
  const [suppliers, rubros, productsWithDescription, allProducts] = await Promise.all([
    db.supplier.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.rubro.findMany({
      orderBy: { name: "asc" },
      include: { subrubros: { orderBy: { name: "asc" } } },
    }),
    db.product.findMany({
      where: { description: { not: null } },
      select: { id: true, name: true, description: true },
    }),
    db.product.findMany({
      select: { id: true, name: true, brand: true, presentation: true },
    }),
  ]);

  const descriptionSuggestions = productsWithDescription
    .filter((p) => p.description)
    .map((p) => ({ productId: p.id, productName: p.name, description: p.description! }));

  const nameSuggestions = allProducts.map((p) => ({
    productId: p.id,
    name: p.name,
    brand: p.brand,
    presentation: p.presentation,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Nuevo producto</h1>
      <div className="mt-6">
        <ProductForm
          action={createProduct}
          suppliers={suppliers}
          rubros={rubros}
          descriptionSuggestions={descriptionSuggestions}
          nameSuggestions={nameSuggestions}
          submitLabel="Crear producto"
        />
      </div>
    </div>
  );
}
