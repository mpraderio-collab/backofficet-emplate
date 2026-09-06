"use client";

import { useActionState, useRef, useEffect } from "react";
import { Field } from "@/components/Field";
import { createRubro, type RubroActionState } from "./actions";

const initialState: RubroActionState = {};

export function RubroForm() {
  const [state, formAction, pending] = useActionState(createRubro, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state.error]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
    >
      <Field label="Nombre del rubro" error={state.fieldErrors?.name}>
        <input
          name="name"
          placeholder="Ej: Alimento balanceado"
          required
          className="input sm:w-56"
        />
      </Field>
      <div className="flex flex-col gap-1.5">
        <span aria-hidden className="hidden text-sm font-medium text-transparent select-none sm:block">
          Acción
        </span>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? "Creando…" : "+ Agregar rubro"}
        </button>
      </div>
    </form>
  );
}
