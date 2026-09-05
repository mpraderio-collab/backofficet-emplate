import Link from "next/link";

const sections = [
  {
    href: "/reports/sales",
    title: "Ventas",
    description: "Total vendido, ticket promedio, ventas por producto y detalle por rango de fechas.",
    bg: "bg-accent-soft",
    fg: "text-accent",
    icon: (
      <path
        d="M4 19V13M10 19V9M16 19V5M22 19H2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/reports/stale-products",
    title: "Productos parados",
    description: "Productos activos sin ventas en el último año, o que nunca se vendieron.",
    bg: "bg-warn-bg",
    fg: "text-warn-ink",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    href: "/reports/cash-register",
    title: "Caja diaria",
    description: "Cobros, pagos y gastos de un día, agrupados por método de pago.",
    bg: "bg-ok-bg",
    fg: "text-ok-ink",
    icon: (
      <>
        <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      </>
    ),
  },
  {
    href: "/reports/aging",
    title: "Cuentas por cobrar y pagar",
    description: "Saldos de clientes y proveedores agrupados por antigüedad.",
    bg: "bg-err-bg",
    fg: "text-err-ink",
    icon: (
      <path
        d="M12 3v18M7 6h7a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
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
            className="flex gap-4 rounded-xl border border-line bg-bg p-5 hover:border-accent"
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${section.bg} ${section.fg}`}>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                {section.icon}
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{section.title}</p>
              <p className="mt-1 text-sm text-ink-soft">{section.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
