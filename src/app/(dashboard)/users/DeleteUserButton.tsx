"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/Alert";
import { useConfirm } from "@/components/ConfirmDialog";
import { deleteUser } from "./actions";

export function DeleteUserButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { confirm, dialog } = useConfirm();

  return (
    <span className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (!(await confirm("¿Borrar este usuario?"))) return;
          startTransition(async () => {
            const res = await deleteUser(id);
            if (res.error) {
              setError(res.error);
              return;
            }
            router.refresh();
          });
        }}
        className="text-xs font-semibold text-err-ink hover:underline disabled:opacity-50"
      >
        Borrar
      </button>
      {error && <Alert variant="error">{error}</Alert>}
      {dialog}
    </span>
  );
}
