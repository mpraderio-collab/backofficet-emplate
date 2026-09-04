export const purchaseOrderStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  sent: "Enviado",
  received: "Recibido",
  cancelled: "Cancelado",
};

export const purchaseOrderStatusColors: Record<string, string> = {
  pending: "bg-warn-bg text-warn-ink",
  sent: "bg-accent-soft text-accent",
  received: "bg-ok-bg text-ok-ink",
  cancelled: "bg-line-soft text-ink-faint",
};
