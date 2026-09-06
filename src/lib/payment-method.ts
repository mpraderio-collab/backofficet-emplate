export const paymentMethods = ["cash", "transfer", "homeBanking", "card", "other"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  homeBanking: "Home banking",
  card: "Tarjeta",
  other: "Otro",
};
