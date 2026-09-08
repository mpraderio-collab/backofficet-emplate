"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/Alert";
import { useConfirm } from "@/components/ConfirmDialog";
import { canDeleteBranch, deleteBranch } from "./actions";

export function DeleteBranchButton({ id }: { id: string }) {
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
          setError(null);
          const check = await canDeleteBranch(id);
          if (check.error) {
            setError(check.error);
            return;
          }
          if (!(await confirm("¿Borrar esta sucursal?"))) return;
          startTransition(async () => {
            const res = await deleteBranch(id);
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
