import Link from "next/link";
import { db } from "@/lib/db";
import { RubroForm } from "./RubroForm";
import { SubrubroForm } from "./SubrubroForm";
import { DeleteRubroButton } from "./DeleteRubroButton";
import { DeleteSubrubroButton } from "./DeleteSubrubroButton";

export default async function RubrosPage() {
  const [rubros, productCountBySubrubro] = await Promise.all([
    db.rubro.findMany({
      orderBy: { name: "asc" },
      include: { subrubros: { orderBy: { name: "asc" } } },
    }),
    db.product.groupBy({ by: ["subrubroId"], _count: { _all: true } }),
  ]);

  const countBySubrubroId = new Map(
    productCountBySubrubro.map((r) => [r.subrubroId, r._count._all]),
  );

  return (
    <div>
      <p className="text-sm text-ink-faint">
        <Link href="/products" className="hover:text-accent">
          Productos
        </Link>{" "}
        / <span className="text-ink">Rubros y subrubros</span>
      </p>
      <h1 className="mt-1 text-2xl font-bold text-ink">Rubros y subrubros</h1>

      <div className="mt-6 flex flex-col gap-6">
        <div>
          <p className="text-sm font-semibold text-ink">Nuevo rubro</p>
          <div className="mt-3">
            <RubroForm />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink">Nuevo subrubro</p>
          <div className="mt-3">
            <SubrubroForm rubros={rubros.map((r) => ({ id: r.id, name: r.name }))} />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink">Rubros cargados</p>
          {rubros.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">Todavía no hay rubros cargados.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-4">
              {rubros.map((rubro) => (
                <div key={rubro.id} className="rounded-xl border border-line bg-bg p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-ink">{rubro.name}</p>
                    <DeleteRubroButton id={rubro.id} />
                  </div>
                  {rubro.subrubros.length === 0 ? (
                    <p className="mt-2 text-sm text-ink-soft">Sin subrubros todavía.</p>
                  ) : (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {rubro.subrubros.map((sub) => (
                        <li
                          key={sub.id}
                          className="flex items-center justify-between text-sm text-ink-soft"
                        >
                          <span>
                            {sub.name}{" "}
                            <span className="text-xs text-ink-faint">
                              ({countBySubrubroId.get(sub.id) ?? 0} productos)
                            </span>
                          </span>
                          {(countBySubrubroId.get(sub.id) ?? 0) === 0 && (
                            <DeleteSubrubroButton id={sub.id} />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
