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
      {error && <span className="t-error-msg text-xs text-err-ink">{error}</span>}
    </label>
  );
}
