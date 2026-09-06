import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { toDateInputValue } from "@/lib/reports";
import { updatePurchaseOrder } from "../../actions";
import { PurchaseOrderForm } from "../../new/PurchaseOrderForm";

export default async function EditPurchaseOrderPage(
  props: PageProps<"/purchase-orders/[id]/edit">,
) {
  const { id } = await props.params;
  const po = await db.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: { select: { name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  });
  if (!po) notFound();
  if (po.status !== "pending") redirect(`/purchase-orders/${id}`);

  const [suppliers, products] = await Promise.all([
    db.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        cost: true,
        fractionUnit: true,
        unitSize: true,
        brand: true,
        animalType: true,
        animalWeight: true,
        subrubro: { select: { name: true } },
        supplierId: true,
        stock: true,
        minStock: true,
        imageUrl: true,
      },
    }),
  ]);

  const boundAction = updatePurchaseOrder.bind(null, po.id);

  return (
    <div>
      <p className="text-sm text-ink-faint">
        <Link href={`/purchase-orders/${po.id}`} className="hover:text-accent">
          Pedido a {po.supplier.name}
        </Link>{" "}
        / <span className="text-ink">Editar</span>
      </p>
      <h1 className="mt-1 text-2xl font-bold text-ink">Editar pedido a {po.supplier.name}</h1>
      <div className="mt-6">
        <PurchaseOrderForm
          suppliers={suppliers}
          products={products}
          action={boundAction}
          submitLabel="Guardar cambios"
          defaultValues={{
            supplierId: po.supplierId,
            orderDate: toDateInputValue(po.orderDate),
            note: po.note ?? "",
            items: po.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              quantity: item.quantity,
              unitCost: item.unitCost,
            })),
          }}
        />
      </div>
    </div>
  );
}
