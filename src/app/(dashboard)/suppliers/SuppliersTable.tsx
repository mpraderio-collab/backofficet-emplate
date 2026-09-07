"use client";

import { useState } from "react";
import { formatDateOnly, formatMoney } from "@/lib/format";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { ClickableRow } from "@/components/ClickableRow";

export type SupplierRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  balance: number;
  lastOrder: Date | null;
};

export function SuppliersTable({ suppliers }: { suppliers: SupplierRow[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? suppliers.filter((s) => s.name.toLowerCase().includes(normalized))
    : suppliers;
  const suggestions = filtered.slice(0, 8);

  return (
    <>
      <div className="relative mt-6 max-w-xs">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-soft">Buscar por nombre</span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Ej: Distribuidora"
            className="input"
          />
        </label>
        <ul
          className={`t-dropdown absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-line bg-bg shadow-lg ${
            open && query ? "is-open" : ""
          }`}
        >
          {suggestions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ink-faint">Sin resultados</li>
          ) : (
            suggestions.map((s) => (
              <li
                key={s.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery(s.name);
                  setOpen(false);
                }}
                className="cursor-pointer px-3 py-2 text-sm text-ink hover:bg-accent-soft"
              >
                {s.name}
              </li>
            ))
          )}
        </ul>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-ink-soft">
          {query ? "Ningún proveedor coincide con esta búsqueda." : "Todavía no hay proveedores cargados."}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Saldo cta. cte.</th>
                <th className="px-4 py-3">Última compra</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <ClickableRow
                  key={s.id}
                  href={`/suppliers/${s.id}`}
                  className="border-b border-line-soft last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-ink transition-colors group-hover:text-accent">
                    {s.name}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {s.phone ? (
                      <WhatsAppLink
                        phone={s.phone}
                        message={`Hola ${s.name}! Te escribo de parte del negocio.`}
                      >
                        {s.phone}
                      </WhatsAppLink>
                    ) : (
                      s.email || "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${
                        s.balance > 0 ? "text-err-ink" : s.balance < 0 ? "text-ok-ink" : "text-ink"
                      }`}
                    >
                      {formatMoney(s.balance)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {s.lastOrder ? formatDateOnly(s.lastOrder) : "—"}
                  </td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
