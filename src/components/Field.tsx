"use client";

import { useEffect, useRef } from "react";

export function Field({
  label,
  error,
  hint,
  children,
  labelClassName = "",
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  // Para filas de varios Field en un grid: si las etiquetas tienen largos
  // distintos, la que ocupa 2 líneas empuja su input más abajo que las
  // demás. Pasar ej. "min-h-10" reserva la misma altura en toda la fila.
  labelClassName?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);

  // Sacude el campo cada vez que aparece un error nuevo (ej. al reenviar el
  // formulario) — remover y reforzar reflow antes de reagregar la clase es
  // lo que permite que la animación se repita si el error persiste.
  useEffect(() => {
    if (!error || !boxRef.current) return;
    const el = boxRef.current;
    el.classList.remove("is-shaking");
    void el.offsetWidth;
    el.classList.add("is-shaking");
  }, [error]);

  return (
    <label className={`t-input-wrap flex flex-col gap-1.5 ${error ? "is-error" : ""}`}>
      <span className={`flex items-end text-sm font-medium text-ink ${labelClassName}`}>
        {label}
      </span>
      <div ref={boxRef} className="t-input">
        {children}
      </div>
      {hint && !error && <span className="text-xs text-ink-soft">{hint}</span>}
      {error && (
        <span className="t-error-msg flex items-center gap-1 text-xs font-medium text-err-ink">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
            className="h-3.5 w-3.5 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.169 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </span>
      )}
    </label>
  );
}
