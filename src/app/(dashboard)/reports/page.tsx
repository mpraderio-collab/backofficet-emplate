import Link from "next/link";

const sections = [
  {
    href: "/reports/sales",
    title: "Ventas",
    description: "Total vendido, ticket promedio, ventas por producto y detalle por rango de fechas.",
  },
  {
    href: "/reports/stale-products",
    title: "Productos parados",
    description: "Productos activos sin ventas en el último año, o que nunca se vendieron.",
  },
];

export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Informes</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-xl border border-line bg-bg p-5 hover:border-accent"
          >
            <p className="text-sm font-semibold text-ink">{section.title}</p>
            <p className="mt-1 text-sm text-ink-soft">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
