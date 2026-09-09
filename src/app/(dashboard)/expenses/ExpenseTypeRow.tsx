"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/Alert";
import { DeleteExpenseTypeButton } from "./DeleteExpenseTypeButton";
import { updateExpenseType, type ExpenseTypeActionState } from "./actions";

type ExpenseType = {
  id: string;
  name: string;
  isRecurring: boolean;
  hasSecondDueDate: boolean;
};

const initialState: ExpenseTypeActionState = {};

export function ExpenseTypeRow({
  expenseType,
  canDelete,
}: {
  expenseType: ExpenseType;
  canDelete: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const boundUpdate = updateExpenseType.bind(null, expenseType.id);
  const [state, formAction, pending] = useActionState(boundUpdate, initialState);

  // Al guardar bien, cerrar la edición y refrescar — comparando la
  // referencia de `state` (cambia en cada acción) en vez de un efecto.
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (!state.error) {
      setEditing(false);
      router.refresh();
    }
  }

  if (!editing) {
    return (
      <tr className="border-b border-line-soft last:border-0">
        <td className="px-4 py-2.5 text-ink">
          {expenseType.name}
          {expenseType.isRecurring && (
            <span className="ml-1.5 rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent">
              Recurrente
            </span>
          )}
          {expenseType.hasSecondDueDate && (
            <span className="ml-1.5 rounded-md bg-warn-bg px-1.5 py-0.5 text-[10px] font-semibold text-warn-ink">
              2do vencimiento
            </span>
          )}
        </td>
        <td className="px-4 py-2.5 text-right">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs font-semibold text-accent hover:underline"
            >
              Editar
            </button>
            {canDelete && <DeleteExpenseTypeButton id={expenseType.id} />}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-line-soft last:border-0">
      <td colSpan={2} className="px-4 py-3">
        <form action={formAction} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              name="name"
              defaultValue={expenseType.name}
              required
              className="input flex-1"
            />
            <button
              type="submit"
              disabled={pending}
              className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {pending ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="shrink-0 text-xs font-semibold text-ink-soft hover:underline"
            >
              Cancelar
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              name="isRecurring"
              defaultChecked={expenseType.isRecurring}
              className="h-4 w-4"
            />
            Es recurrente
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              name="hasSecondDueDate"
              defaultChecked={expenseType.hasSecondDueDate}
              className="h-4 w-4"
            />
            Tiene vencimiento con recargo
          </label>
          {state.error && <Alert variant="error">{state.error}</Alert>}
        </form>
      </td>
    </tr>
  );
}
