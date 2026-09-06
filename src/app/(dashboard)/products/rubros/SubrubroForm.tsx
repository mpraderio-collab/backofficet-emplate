"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { Field } from "@/components/Field";
import { Combobox } from "@/components/Combobox";
import { createSubrubro, type SubrubroActionState } from "./actions";

type RubroOption = { id: string; name: string };

const initialState: SubrubroActionState = {};

export function SubrubroForm({ rubros }: { rubros: RubroOption[] }) {
  const [state, formAction, pending] = useActionState(createSubrubro, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [rubroId, setRubroId] = useState(rubros[0]?.id ?? "");

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state.error]);

  if (rubros.length === 0) {
    return (
      <p className="text-sm text-ink-soft">Creá un rubro primero para poder agregarle subrubros.</p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <input type="hidden" name="rubroId" value={rubroId} />
      <Field label="Rubro" error={state.fieldErrors?.rubroId}>
        <Combobox
          value={rubroId}
          onChange={setRubroId}
          placeholder="Buscar rubro…"
          className="sm:w-48"
          options={rubros.map((r) => ({ value: r.id, label: r.name }))}
        />
      </Field>
      <Field label="Nombre del subrubro" error={state.fieldErrors?.name}>
        <input
          name="name"
          placeholder="Ej: Mordida chica"
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
          {pending ? "Creando…" : "+ Agregar subrubro"}
        </button>
      </div>
    </form>
  );
}
