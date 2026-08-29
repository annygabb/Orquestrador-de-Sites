import { createRenewalSubscription, getAsaasPayment } from "@/lib/asaas";
import { ACCESS_DAYS, RENEWAL_PRICE_CENTS, addDays, eventGrantsAccess, eventRemovesAccess, paymentWasSettled, shouldSuspendForEvent } from "@/lib/billing";
import { sendLifecycleEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { validWebhookToken } from "@/lib/webhook-security";

export const runtime = "nodejs";

const eventSchema = z.object({ id: z.string().min(1).max(160), event: z.string().min(1).max(80), payment: z.object({ id: z.string().min(1).max(120) }) });

export async function POST(request: Request) {
  if (!validWebhookToken(request.headers.get("asaas-access-token"), process.env.ASAAS_WEBHOOK_TOKEN)) return NextResponse.json({ message: "Webhook não autorizado." }, { status: 401 });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 131_072) return NextResponse.json({ message: "Evento muito grande." }, { status: 413 });
  let parsed: z.infer<typeof eventSchema>;
  try { parsed = eventSchema.parse(await request.json()); } catch { return NextResponse.json({ message: "Evento inválido." }, { status: 400 }); }
  const admin = createAdminClient();
  const { data: existing } = await admin.from("billing_events").select("status").eq("provider_event_id", parsed.id).maybeSingle();
  if (existing?.status === "processed") return NextResponse.json({ received: true, duplicate: true });
  await admin.from("billing_events").upsert({ provider_event_id: parsed.id, event_type: parsed.event, provider_payment_id: parsed.payment.id, status: "processing", payload: parsed }, { onConflict: "provider_event_id" });
  try {
    const payment = await getAsaasPayment(parsed.payment.id);
    const external = payment.externalReference || "";
    let userId = external.includes(":") ? external.split(":")[1] : "";
    if (!userId) {
      const { data: profile } = await admin.from("profiles").select("id").eq("asaas_customer_id", payment.customer).maybeSingle();
      userId = profile?.id || "";
    }
    if (!userId) throw new Error("Não foi possível vincular a cobrança a uma conta.");
    const kind = external.startsWith("activation:") ? "activation" : "renewal";
    const { data: storedPayment } = await admin.from("payments").select("status").eq("provider_payment_id", payment.id).maybeSingle();
    const alreadySettled = paymentWasSettled(storedPayment?.status);
    await admin.from("payments").upsert({ user_id: userId, kind, provider_payment_id: payment.id, provider_subscription_id: payment.subscription || null, amount_cents: Math.round((payment.value || 0) * 100), status: parsed.event.replace("PAYMENT_", "").toLowerCase(), due_date: payment.dueDate || null, paid_at: payment.paymentDate ? new Date(payment.paymentDate).toISOString() : null, invoice_url: payment.invoiceUrl || null }, { onConflict: "provider_payment_id" });
    const { data: subscription } = await admin.from("subscriptions").select("paid_until,provider_subscription_id").eq("user_id", userId).maybeSingle();
    const { data: authData } = await admin.auth.admin.getUserById(userId);
    const email = authData.user?.email || ""; const name = authData.user?.user_metadata?.full_name;
    if (eventGrantsAccess(parsed.event) && !alreadySettled) {
      const base = subscription?.paid_until && new Date(subscription.paid_until) > new Date() ? new Date(subscription.paid_until) : new Date();
      const paidUntil = addDays(base, ACCESS_DAYS);
      let providerSubscriptionId = subscription?.provider_subscription_id || payment.subscription || null;
      if (kind === "activation" && !providerSubscriptionId) {
        const renewal = await createRenewalSubscription({ userId, customerId: payment.customer, nextDueDate: paidUntil });
        providerSubscriptionId = renewal.id;
      }
      await admin.from("subscriptions").upsert({ user_id: userId, status: "active", paid_until: paidUntil.toISOString(), next_due_date: paidUntil.toISOString().slice(0, 10), provider_subscription_id: providerSubscriptionId, renewal_amount_cents: RENEWAL_PRICE_CENTS, cancel_at_period_end: false }, { onConflict: "user_id" });
      await sendLifecycleEmail({ userId, email, name, kind: "activation_paid", dedupeKey: `paid:${parsed.payment.id}` }).catch(() => undefined);
    } else if (parsed.event === "PAYMENT_OVERDUE" && !shouldSuspendForEvent(parsed.event, subscription?.paid_until)) {
      await sendLifecycleEmail({ userId, email, name, kind: "payment_overdue", dedupeKey: `overdue:${parsed.payment.id}` }).catch(() => undefined);
    } else if (eventRemovesAccess(parsed.event) && shouldSuspendForEvent(parsed.event, subscription?.paid_until)) {
      await admin.from("subscriptions").upsert({ user_id: userId, status: "overdue" }, { onConflict: "user_id" });
      await sendLifecycleEmail({ userId, email, name, kind: "access_suspended", dedupeKey: `suspended:${parsed.payment.id}:${parsed.event}` }).catch(() => undefined);
    }
    await admin.from("billing_events").update({ status: "processed", processed_at: new Date().toISOString(), last_error: null }).eq("provider_event_id", parsed.id);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[asaas-webhook]", error);
    await admin.from("billing_events").update({ status: "failed", last_error: error instanceof Error ? error.message.slice(0, 500) : "Falha desconhecida" }).eq("provider_event_id", parsed.id);
    return NextResponse.json({ message: "Evento não processado." }, { status: 500 });
  }
}
