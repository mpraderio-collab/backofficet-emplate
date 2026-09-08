"use client";

import { useState } from "react";

// Input numérico simple (cantidades, porcentajes, stock). Igual que
// MoneyInput: si el valor es 0, al hacer foco se limpia para no obligar a
// borrar el "0" a mano — si se va sin escribir nada, vuelve a 0.
export function NumberInput({
  name,
  value,
  defaultValue,
  onChange,
  min,
  max,
  step,
  required,
  disabled,
  className = "",
}: {
  name?: string;
  value?: number | "";
  defaultValue?: number | "";
  onChange?: (value: number | "") => void;
  min?: number;
  max?: number;
  step?: number | "any";
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<number | "">(defaultValue ?? "");
  const current = isControlled ? value : internal;
  const [zeroCleared, setZeroCleared] = useState(false);

  function setValue(next: number | "") {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setZeroCleared(false);
    const raw = e.target.value;
    setValue(raw === "" ? "" : Number(raw));
  }

  function handleFocus() {
    if (current === 0) {
      setZeroCleared(true);
      setValue("");
    }
  }

  function handleBlur() {
    if (zeroCleared && current === "") setValue(0);
    setZeroCleared(false);
  }

  return (
    <input
      type="number"
      name={name}
      value={current}
      min={min}
      max={max}
      step={step}
      required={required}
      disabled={disabled}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`input ${className}`}
    />
  );
}
