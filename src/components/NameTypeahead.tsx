"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type NameSuggestion = {
  productId: string;
  name: string;
  brand: string | null;
  presentation: string | null;
};

// Input de nombre con autocompletado: a medida que se tipea, muestra
// productos ya cargados con nombre parecido — para notar que ya existe
// antes de cargar uno repetido por accidente. No bloquea nada (un mismo
// nombre en distinta presentación es válido, ver Product.presentation) —
// es solo una ayuda visual, mismo patrón que DescriptionTypeahead.
export function NameTypeahead({
  name,
  defaultValue,
  suggestions,
  excludeProductId,
}: {
  name: string;
  defaultValue?: string | null;
  suggestions: NameSuggestion[];
  excludeProductId?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = useId();
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

  const normalizedQuery = value.trim().toLowerCase();
  const filtered =
    normalizedQuery.length < 2
      ? []
      : suggestions
          .filter((s) => s.productId !== excludeProductId)
          .filter((s) => s.name.toLowerCase().includes(normalizedQuery));

  const filterKey = `${value}|${open}`;
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
      if (!insideContainer && !insideList) doClose();
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function selectSuggestion(suggestion: NameSuggestion) {
    setValue(suggestion.name);
    doClose();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && open) {
      // No hace submit del form al elegir una sugerencia con Enter.
      e.preventDefault();
      const suggestion = filtered[highlighted];
      if (suggestion) selectSuggestion(suggestion);
    } else if (e.key === "Escape") {
      doClose();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        name={name}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          doOpen();
        }}
        onFocus={doOpen}
        onKeyDown={handleKeyDown}
        required
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        className="input"
      />
      {(open || closing) &&
        portalRect &&
        filtered.length > 0 &&
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
            {filtered.map((suggestion, i) => (
              <li
                key={suggestion.productId}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSuggestion(suggestion);
                }}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  i === highlighted ? "bg-accent-soft" : ""
                }`}
              >
                <p className="truncate text-ink">{suggestion.name}</p>
                {(suggestion.brand || suggestion.presentation) && (
                  <p className="truncate text-xs text-ink-faint">
                    {[suggestion.brand, suggestion.presentation].filter(Boolean).join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
