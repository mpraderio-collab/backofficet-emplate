"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Panel Principal" },
  { href: "/products", label: "Productos" },
  { href: "/products/price-list", label: "Lista de precios" },
  { href: "/products/bulk-update", label: "Actualizar precios por lote" },
  { href: "/signage", label: "Modo Cartelería (TV)", newTab: true },
  { href: "/customers", label: "Clientes" },
  { href: "/suppliers", label: "Proveedores" },
  { href: "/sales", label: "Ventas" },
  { href: "/purchase-orders", label: "Pedidos a proveedores" },
  { href: "/expenses", label: "Gastos" },
  { href: "/reports", label: "Informes" },
  { href: "/branches", label: "Sucursales" },
  { href: "/users", label: "Usuarios" },
];

export function DashboardNav({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();

  // Con rutas anidadas (ej. "/products" y "/products/price-list") no alcanza
  // con startsWith: hay que quedarse con el link más específico que matchea,
  // si no "Productos" y "Lista de precios" quedarían resaltados a la vez.
  const activeHref = [...navLinks]
    .sort((a, b) => b.href.length - a.href.length)
    .find((l) => (l.href === "/" ? pathname === "/" : pathname?.startsWith(l.href)))?.href;

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {navLinks.map((link) => {
        const active = link.href === activeHref;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            target={link.newTab ? "_blank" : undefined}
            className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-white/12 font-bold text-white"
                : "font-medium text-white/78 hover:bg-white/12 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
