"use client";

import { useState } from "react";

// Input de plata con separador de miles mientras se escribe (ej: "15.000").
// El valor real (sin puntos) viaja en un input oculto con `name`, así el
// FormData del form sigue recibiendo el número en crudo. Soporta uso
// controlado (value/onChange) o no controlado (defaultValue), como los
// inputs nativos que reemplaza.
export function MoneyInput({
  name,
  value,
  defaultValue,
  onChange,
  max,
  required,
  disabled,
  className = "",
  placeholder,
}: {
  name?: string;
  value?: number | "";
  defaultValue?: number | "";
  onChange?: (value: number | "") => void;
  max?: number;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<number | "">(defaultValue ?? "");
  const current = isControlled ? value : internal;

  const display = current === "" ? "" : new Intl.NumberFormat("es-AR").format(current);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    let next: number | "" = digits === "" ? "" : Number(digits);
    if (next !== "" && max != null && next > max) next = max;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={current} />}
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className={`input ${className}`}
      />
    </>
  );
}
