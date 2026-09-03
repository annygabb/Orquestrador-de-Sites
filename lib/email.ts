import { createAdminClient } from "./supabase/admin";
import { renderLifecycleEmail, type LifecycleEmailKind } from "./email-template";

export type EmailKind = LifecycleEmailKind;

const subjects: Record<EmailKind, string> = {
  welcome: "Sua conta no Orquestrador está pronta",
  activation_paid: "Pagamento confirmado e acesso liberado",
  renewal_reminder: "Sua renovação vence em 3 dias",
  payment_overdue: "Não identificamos o pagamento da renovação",
  access_suspended: "Seu acesso ao Orquestrador foi suspenso",
  subscription_canceled: "A renovação foi cancelada",
};

export async function sendLifecycleEmail(input: { userId: string; email: string; name?: string | null; kind: EmailKind; dedupeKey: string }) {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const origin = (process.env.APP_ORIGIN || "http://localhost:3000").replace(/\/$/, "");
  if (!resendKey || !from) return { skipped: true as const };
  const admin = createAdminClient();
  const { data: existing } = await admin.from("email_events").select("id,status").eq("dedupe_key", input.dedupeKey).maybeSingle();
  if (existing?.status === "sent") return { skipped: true as const };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json", "Idempotency-Key": input.dedupeKey },
    body: JSON.stringify({ from, to: [input.email], subject: subjects[input.kind], html: renderLifecycleEmail(input.kind, input.name || "", `${origin}/perfil`) }),
  });
  const body = await response.json().catch(() => ({}));
  await admin.from("email_events").upsert({ user_id: input.userId, kind: input.kind, dedupe_key: input.dedupeKey, status: response.ok ? "sent" : "failed", provider_id: body?.id ?? null, last_error: response.ok ? null : JSON.stringify(body), sent_at: response.ok ? new Date().toISOString() : null }, { onConflict: "dedupe_key" });
  if (!response.ok) throw new Error("O e-mail transacional não pôde ser enviado.");
  return { skipped: false as const, id: body.id as string };
}
