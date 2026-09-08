"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type ComboboxOption = {
  value: string;
  label: string;
  sublabel?: string;
  // Fila "enriquecida" (imagen + descripción + precio), usada en el
  // buscador de productos. Si se pasa cualquiera de estos tres, la opción
  // se renderiza con ese layout en vez de la fila compacta de texto plano.
  imageUrl?: string | null;
  description?: string | null;
  priceLabel?: string;
  // Texto adicional que participa en la búsqueda pero no se muestra (ej:
  // código de barras / SKU) — así un lector de código de barras, que
  // escanea y tipea el código en este mismo input, también encuentra la
  // opción por más que la lista solo muestre el nombre.
  keywords?: string | null;
};

export function Combobox({
  options,
  value,
  onChange,
  name,
  placeholder = "Buscar…",
  emptyMessage = "Sin resultados",
  className = "",
}: {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  name?: string;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = useId();
  // La lista se porta a document.body en vez de quedar como hijo absolute
  // acá adentro — algunos navegadores pintan controles nativos (<select>,
  // <input type="date">) por encima de contenido posicionado cercano sin
  // importar el z-index, y eso mezclaba visualmente la lista con los
  // campos siguientes del formulario. Como <body>, gana siempre.
  const [portalRect, setPortalRect] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!open) return;
    function updateRect() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPortalRect({ top: rect.bottom, left: rect.left, width: rect.width });
    }
    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [open]);

  function doOpen() {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setClosing(false);
    setOpen(true);
  }

  function doClose() {
    setOpen(false);
    setClosing(true);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => setClosing(false), 150);
  }

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const selected = options.find((o) => o.value === value);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? options.filter((o) =>
        `${o.label} ${o.sublabel ?? ""} ${o.keywords ?? ""}`.toLowerCase().includes(normalizedQuery),
      )
    : options;

  // Reinicia el resaltado cada vez que cambia la búsqueda o se abre/cierra
  // la lista, ajustando el estado durante el render en vez de un efecto.
  const filterKey = `${query}|${open}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setHighlighted(0);
  }

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      const insideContainer = containerRef.current?.contains(target);
      const insideList = listRef.current?.contains(target);
      if (!insideContainer && !insideList) {
        doClose();
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function selectOption(option: ComboboxOption) {
    onChange(option.value);
    setQuery("");
    doClose();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        doOpen();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const option = filtered[highlighted];
      if (option) selectOption(option);
    } else if (e.key === "Escape") {
      doClose();
      setQuery("");
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value} />}
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        autoComplete="off"
        className="input"
        value={open ? query : (selected?.label ?? "")}
        placeholder={placeholder}
        onFocus={() => {
          doOpen();
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          doOpen();
        }}
        onKeyDown={handleKeyDown}
      />
      {(open || closing) &&
        portalRect &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            data-origin="top-left"
            className={`t-dropdown fixed z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-line bg-bg shadow-lg ${
              open ? "is-open" : "is-closing"
            }`}
            style={{ top: portalRect.top, left: portalRect.left, width: portalRect.width }}
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-ink-faint">{emptyMessage}</li>
            ) : (
              filtered.map((option, i) => {
                const isRich =
                  option.imageUrl !== undefined ||
                  option.description !== undefined ||
                  option.priceLabel !== undefined;
                return (
                  <li
                    key={option.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectOption(option);
                    }}
                    className={`cursor-pointer px-3 py-2 text-sm ${
                      i === highlighted ? "bg-accent-soft" : ""
                    }`}
                  >
                    {isRich ? (
                      <div className="flex items-center gap-3">
                        {option.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={option.imageUrl}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg border border-line object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded-lg border border-line bg-surface" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-accent">{option.label}</p>
                          {option.description && (
                            <p className="truncate text-xs text-ink-faint">{option.description}</p>
                          )}
                        </div>
                        {option.priceLabel && (
                          <span className="shrink-0 font-semibold text-ink">{option.priceLabel}</span>
                        )}
                      </div>
                    ) : (
                      <span className={i === highlighted ? "text-accent" : "text-ink"}>
                        {option.label}
                        {option.sublabel && (
                          <span className="ml-1.5 text-xs text-ink-faint">{option.sublabel}</span>
                        )}
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>,
          document.body,
        )}
    </div>
  );
}
