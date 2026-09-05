"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Panorama" },
  { href: "/products", label: "Productos" },
  { href: "/customers", label: "Clientes" },
  { href: "/suppliers", label: "Proveedores" },
  { href: "/sales", label: "Ventas" },
  { href: "/purchase-orders", label: "Pedidos a proveedores" },
  { href: "/expenses", label: "Gastos" },
  { href: "/reports", label: "Informes" },
  { href: "/users", label: "Usuarios" },
];

export function DashboardNav({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {navLinks.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
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
