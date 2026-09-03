import assert from "node:assert/strict";
import test from "node:test";
import { ACCESS_DAYS, ACTIVATION_PRICE_CENTS, RENEWAL_PRICE_CENTS, addDays, eventGrantsAccess, eventRemovesAccess, paymentWasSettled, shouldSuspendForEvent } from "../lib/billing.ts";
import { subscriptionEntitlement } from "../lib/subscription-access.ts";
import { validWebhookToken } from "../lib/webhook-security.ts";

test("modelo comercial usa 59,90 na ativação e 29,90 na renovação", () => {
  assert.equal(ACTIVATION_PRICE_CENTS, 5990);
  assert.equal(RENEWAL_PRICE_CENTS, 2990);
  assert.equal(ACCESS_DAYS, 30);
});

test("pagamento confirmado libera 30 dias e evento vencido remove acesso", () => {
  const start = new Date("2026-08-29T12:00:00.000Z");
  assert.equal(addDays(start, 30).toISOString(), "2026-09-28T12:00:00.000Z");
  assert.equal(eventGrantsAccess("PAYMENT_CONFIRMED"), true);
  assert.equal(eventRemovesAccess("PAYMENT_OVERDUE"), true);
});

test("acesso depende do relógio do servidor e do status", () => {
  const now = new Date("2026-08-29T12:00:00.000Z");
  assert.equal(subscriptionEntitlement({ status: "active", paid_until: "2026-08-30T12:00:00.000Z", next_due_date: "2026-08-30", cancel_at_period_end: false }, now).allowed, true);
  assert.equal(subscriptionEntitlement({ status: "active", paid_until: "2026-08-29T11:59:59.000Z", next_due_date: "2026-08-29", cancel_at_period_end: false }, now).allowed, false);
  assert.equal(subscriptionEntitlement({ status: "overdue", paid_until: "2026-09-30T00:00:00.000Z", next_due_date: "2026-08-29", cancel_at_period_end: false }, now).allowed, false);
});

test("cancelamento preserva o período pago", () => {
  const now = new Date("2026-08-29T12:00:00.000Z");
  const result = subscriptionEntitlement({ status: "canceled", paid_until: "2026-09-10T00:00:00.000Z", next_due_date: null, cancel_at_period_end: true }, now);
  assert.equal(result.allowed, true);
  assert.equal(result.state, "canceled");
});

test("token do webhook exige correspondência exata", () => {
  assert.equal(validWebhookToken("segredo-forte", "segredo-forte"), true);
  assert.equal(validWebhookToken("segredo", "segredo-forte"), false);
  assert.equal(validWebhookToken(null, "segredo-forte"), false);
});

test("eventos confirmado e recebido da mesma cobrança não duplicam acesso", () => {
  assert.equal(paymentWasSettled("confirmed"), true);
  assert.equal(paymentWasSettled("received"), true);
  assert.equal(paymentWasSettled("pending"), false);
});

test("evento vencido antigo não derruba período já renovado", () => {
  const now = new Date("2026-08-29T12:00:00.000Z");
  assert.equal(shouldSuspendForEvent("PAYMENT_OVERDUE", "2026-09-28T12:00:00.000Z", now), false);
  assert.equal(shouldSuspendForEvent("PAYMENT_OVERDUE", "2026-08-28T12:00:00.000Z", now), true);
  assert.equal(shouldSuspendForEvent("PAYMENT_REFUNDED", "2026-09-28T12:00:00.000Z", now), true);
});
