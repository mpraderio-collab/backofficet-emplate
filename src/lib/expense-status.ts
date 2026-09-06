export type ExpenseStatus = "paid" | "overdue" | "pending";

// "pending" = todavía no venció y no está pagado; "overdue" = venció y
// sigue sin pagarse. `today` se recibe como parámetro — pasar
// startOfTodayUTC() (no startOfToday()), porque dueDate se guarda como
// medianoche UTC (ver startOfTodayUTC en lib/reports).
export function getExpenseStatus(dueDate: Date, paidDate: Date | null, today: Date): ExpenseStatus {
  if (paidDate) return "paid";
  return dueDate < today ? "overdue" : "pending";
}

export const expenseStatusLabels: Record<ExpenseStatus, string> = {
  paid: "Pagado",
  overdue: "Vencido",
  pending: "Pendiente",
};

export const expenseStatusColors: Record<ExpenseStatus, string> = {
  paid: "bg-ok-bg text-ok-ink",
  overdue: "bg-err-bg text-err-ink",
  pending: "bg-warn-bg text-warn-ink",
};
