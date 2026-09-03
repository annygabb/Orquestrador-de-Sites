export const ACTIVATION_PRICE_CENTS = 5990;
export const RENEWAL_PRICE_CENTS = 2990;
export const ACCESS_DAYS = 30;

export function moneyFromCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function eventGrantsAccess(event: string) {
  return ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"].includes(event);
}

export function eventRemovesAccess(event: string) {
  return ["PAYMENT_OVERDUE", "PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_CHARGEBACK_DISPUTE"].includes(event);
}

export function paymentWasSettled(status?: string | null) {
  return status === "confirmed" || status === "received";
}

export function shouldSuspendForEvent(event: string, paidUntil?: string | null, now = new Date()) {
  if (["PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_CHARGEBACK_DISPUTE"].includes(event)) return true;
  if (event !== "PAYMENT_OVERDUE") return false;
  return !paidUntil || new Date(paidUntil).getTime() <= now.getTime();
}
