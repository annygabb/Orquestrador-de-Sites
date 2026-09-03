export type EntitlementState = "active" | "pending" | "overdue" | "canceled" | "inactive";
export type Entitlement = {
  allowed: boolean;
  state: EntitlementState;
  userId?: string;
  paidUntil?: string | null;
  nextDueDate?: string | null;
  cancelAtPeriodEnd?: boolean;
};

export type SubscriptionRow = {
  status: string;
  paid_until: string | null;
  next_due_date: string | null;
  cancel_at_period_end: boolean;
};

export function subscriptionEntitlement(row: SubscriptionRow | null, now = new Date()): Entitlement {
  if (!row) return { allowed: false, state: "inactive" };
  const paidUntil = row.paid_until ? new Date(row.paid_until) : null;
  const allowed = Boolean(paidUntil && paidUntil.getTime() > now.getTime() && ["active", "canceled"].includes(row.status));
  const state: EntitlementState = allowed
    ? (row.cancel_at_period_end || row.status === "canceled" ? "canceled" : "active")
    : row.status === "pending" ? "pending"
      : row.status === "overdue" ? "overdue"
        : row.status === "canceled" ? "canceled" : "inactive";
  return { allowed, state, paidUntil: row.paid_until, nextDueDate: row.next_due_date, cancelAtPeriodEnd: row.cancel_at_period_end };
}
