import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export default async function ProductsPage() {
  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { supplier: { select: { name: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Productos</h1>
        <Link
          href="/products/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover"
        >
          + Nuevo producto
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-6 text-ink-soft">Todavía no hay productos cargados.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{p.name}</p>
                    {p.sku && (
                      <p className="font-mono text-xs text-ink-faint">{p.sku}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {p.supplier?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">
                    {formatMoney(p.price)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.stock <= 0
                          ? "font-semibold text-err-ink"
                          : p.stock <= 5
                            ? "font-semibold text-warn-ink"
                            : "text-ink"
                      }
                    >
                      {p.stock}
                    </span>
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
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/products/${p.id}`}
                      className="font-semibold text-accent hover:underline"
                    >
                      Editar
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
