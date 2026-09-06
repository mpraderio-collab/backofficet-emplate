"use client";

import { useState } from "react";
import { formatDate, formatMoney } from "@/lib/format";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { ClickableRow } from "@/components/ClickableRow";

export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  balance: number;
  lastSale: Date | null;
};

export function CustomersTable({ customers }: { customers: CustomerRow[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? customers.filter((c) => c.name.toLowerCase().includes(normalized))
    : customers;
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
            placeholder="Ej: Carlos"
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
            suggestions.map((c) => (
              <li
                key={c.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery(c.name);
                  setOpen(false);
                }}
                className="cursor-pointer px-3 py-2 text-sm text-ink hover:bg-accent-soft"
              >
                {c.name}
              </li>
            ))
          )}
        </ul>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-ink-soft">
          {query ? "Ningún cliente coincide con esta búsqueda." : "Todavía no hay clientes cargados."}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Saldo cta. cte.</th>
                <th className="px-4 py-3">Última venta</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <ClickableRow
                  key={c.id}
                  href={`/customers/${c.id}`}
                  className="border-b border-line-soft last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {c.phone ? (
                      <WhatsAppLink
                        phone={c.phone}
                        message={`Hola ${c.name}! Te escribo de parte del negocio.`}
                      >
                        {c.phone}
                      </WhatsAppLink>
                    ) : (
                      c.email || "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${
                        c.balance > 0 ? "text-err-ink" : c.balance < 0 ? "text-ok-ink" : "text-ink"
                      }`}
                    >
                      {formatMoney(c.balance)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {c.lastSale ? formatDate(c.lastSale) : "—"}
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
