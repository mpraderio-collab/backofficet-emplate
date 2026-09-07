"use client";

import { useCallback, useEffect, useState } from "react";

type ConfirmRequest = {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
  resolve: (value: boolean) => void;
};

type ConfirmOptions = {
  confirmLabel?: string;
  cancelLabel?: string;
  // false para acciones no destructivas (ej: "Volver a pendiente").
  danger?: boolean;
};

// Reemplazo del confirm() nativo del navegador: un modal propio con el
// estilo de la app, sin bloquear el hilo — se espera con `await`.
// Uso: const { confirm, dialog } = useConfirm(); ...renderizar {dialog}...
export function useConfirm() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const confirm = useCallback((message: string, options?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setRequest({
        message,
        confirmLabel: options?.confirmLabel ?? "Confirmar",
        cancelLabel: options?.cancelLabel ?? "Cancelar",
        danger: options?.danger ?? true,
        resolve,
      });
    });
  }, []);

  function settle(value: boolean) {
    request?.resolve(value);
    setRequest(null);
  }

  const dialog = request ? (
    <ConfirmDialog
      message={request.message}
      confirmLabel={request.confirmLabel}
      cancelLabel={request.cancelLabel}
      danger={request.danger}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  ) : null;

  return { confirm, dialog };
}

function ConfirmDialog({
  message,
  confirmLabel,
  cancelLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      role="presentation"
      className="t-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-describedby="confirm-dialog-message"
        className="t-modal w-full max-w-sm rounded-xl border border-line bg-bg p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              danger ? "bg-err-bg text-err-ink" : "bg-warn-bg text-warn-ink"
            }`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.169 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <p id="confirm-dialog-message" className="mt-1.5 text-sm text-ink">
            {message}
          </p>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="rounded-lg border border-border-input bg-bg px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-bold text-white ${
              danger
                ? "bg-err-ink hover:opacity-90"
                : "bg-primary hover:bg-primary-hover"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
