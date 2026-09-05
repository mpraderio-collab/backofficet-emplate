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
  return (
    <label className="flex flex-col gap-1.5">
      <span className={`text-sm font-medium text-ink ${labelClassName}`}>{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-ink-soft">{hint}</span>}
      {error && <span className="text-xs text-err-ink">{error}</span>}
    </label>
  );
}
