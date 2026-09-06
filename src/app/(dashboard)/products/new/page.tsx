import { db } from "@/lib/db";
import { createProduct } from "../actions";
import { ProductForm } from "../ProductForm";

export default async function NewProductPage() {
  const [suppliers, rubros] = await Promise.all([
    db.supplier.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.rubro.findMany({
      orderBy: { name: "asc" },
      include: { subrubros: { orderBy: { name: "asc" } } },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Nuevo producto</h1>
      <div className="mt-6">
        <ProductForm
          action={createProduct}
          suppliers={suppliers}
          rubros={rubros}
          submitLabel="Crear producto"
        />
      </div>
    </div>
  );
}
