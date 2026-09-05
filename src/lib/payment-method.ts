export const paymentMethods = ["cash", "transfer", "card", "other"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro",
};
