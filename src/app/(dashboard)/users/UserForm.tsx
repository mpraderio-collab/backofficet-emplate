"use client";

import { useActionState, useRef, useEffect } from "react";
import { Field } from "@/components/Field";
import { createUser, type UserActionState } from "./actions";

const initialState: UserActionState = {};

export function UserForm() {
  const [state, formAction, pending] = useActionState(createUser, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state.error]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-line bg-bg p-5 sm:flex-row sm:items-end sm:flex-wrap"
    >
      {state.error && (
        <p className="w-full rounded-lg bg-err-bg px-3 py-2 text-sm text-err-ink">
          {state.error}
        </p>
      )}
      <Field label="Nombre" error={state.fieldErrors?.name}>
        <input name="name" required className="input sm:w-48" />
      </Field>
      <Field label="Email" error={state.fieldErrors?.email}>
        <input name="email" type="email" required className="input sm:w-56" />
      </Field>
      <Field label="Contraseña" error={state.fieldErrors?.password}>
        <input name="password" type="password" required minLength={6} className="input sm:w-40" />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="h-fit rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear usuario"}
      </button>
    </form>
  );
}
