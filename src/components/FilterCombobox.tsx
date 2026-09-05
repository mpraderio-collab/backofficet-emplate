"use client";

import { useState } from "react";
import { Combobox, type ComboboxOption } from "./Combobox";

// Envuelve Combobox con estado propio para usarlo dentro de un <form
// method="get"> de filtros: mantiene el valor elegido y lo manda como
// input oculto (vía el prop `name` de Combobox) al enviar el formulario.
export function FilterCombobox({
  name,
  defaultValue,
  options,
  placeholder,
  className,
}: {
  name: string;
  defaultValue: string;
  options: ComboboxOption[];
  placeholder?: string;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <Combobox
      name={name}
      value={value}
      onChange={setValue}
      options={options}
      placeholder={placeholder}
      className={className}
    />
  );
}
