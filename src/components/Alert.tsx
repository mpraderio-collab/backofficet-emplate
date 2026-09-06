type AlertVariant = "error" | "warning" | "success";

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  error: "border-err-line bg-err-bg text-err-ink",
  warning: "border-warn-line bg-warn-bg text-warn-ink",
  success: "border-ok-line bg-ok-bg text-ok-ink",
};

function WarningIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-4 w-4 shrink-0">
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.169 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-4 w-4 shrink-0">
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 0 1 .006 1.415l-7.5 7.6a1 1 0 0 1-1.42.005l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.797 2.796 6.79-6.876a1 1 0 0 1 1.413-.026Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const VARIANT_ICONS: Record<AlertVariant, React.ReactNode> = {
  error: <WarningIcon />,
  warning: <WarningIcon />,
  success: <CheckIcon />,
};

// Mensaje de alerta con color, ícono y una leve aparición — usado para
// errores de servidor, avisos ("este cliente ya tiene saldo") y
// confirmaciones de forms en toda la app. Para el error puntual de un
// campo individual dentro de un formulario, usar Field (no este).
export function Alert({
  variant = "error",
  children,
  className = "",
}: {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`t-alert flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${VARIANT_CLASSES[variant]} ${className}`}
    >
      <span className="mt-0.5">{VARIANT_ICONS[variant]}</span>
      <span>{children}</span>
    </div>
  );
}
