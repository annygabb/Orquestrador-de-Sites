import { createAdminClient } from "./supabase/admin";
import { escapeHtml } from "./html";

export type EmailKind = "welcome" | "activation_paid" | "renewal_reminder" | "payment_overdue" | "access_suspended" | "subscription_canceled";

const subjects: Record<EmailKind, string> = {
  welcome: "Sua conta no Orquestrador está pronta",
  activation_paid: "Pagamento confirmado e acesso liberado",
  renewal_reminder: "Sua renovação vence em 3 dias",
  payment_overdue: "Não identificamos o pagamento da renovação",
  access_suspended: "Seu acesso ao Orquestrador foi suspenso",
  subscription_canceled: "A renovação foi cancelada",
};

function template(kind: EmailKind, name: string, manageUrl: string) {
  const messages: Record<EmailKind, string> = {
    welcome: "Sua conta foi criada. O próximo passo é ativar o plano e montar a primeira seleção de skills.",
    activation_paid: "Recebemos o pagamento. Seu acesso já está ativo por 30 dias.",
    renewal_reminder: "Sua renovação mensal vence em 3 dias. Confira a cobrança no seu perfil.",
    payment_overdue: "A renovação venceu e ainda não foi confirmada. Regularize o pagamento para evitar a suspensão.",
    access_suspended: "O período pago terminou sem renovação confirmada. O painel e o MCP foram bloqueados, mas seus dados continuam salvos.",
    subscription_canceled: "A renovação foi cancelada. Você mantém o acesso até o fim do período já pago.",
  };
  const safeName = escapeHtml(name);
  const safeManageUrl = escapeHtml(manageUrl);
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172033"><h1 style="font-size:24px">Olá, ${safeName}</h1><p style="font-size:16px;line-height:1.6">${messages[kind]}</p><p><a href="${safeManageUrl}" style="color:#0b63e5;font-weight:700">Abrir meu perfil</a></p><p style="font-size:13px;color:#5e6778">Orquestrador de Sites, idealização e requisitos por Anny Gabrielly</p></div>`;
}

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
    body: JSON.stringify({ from, to: [input.email], subject: subjects[input.kind], html: template(input.kind, input.name || "", `${origin}/perfil`) }),
  });
  const body = await response.json().catch(() => ({}));
  await admin.from("email_events").upsert({ user_id: input.userId, kind: input.kind, dedupe_key: input.dedupeKey, status: response.ok ? "sent" : "failed", provider_id: body?.id ?? null, last_error: response.ok ? null : JSON.stringify(body), sent_at: response.ok ? new Date().toISOString() : null }, { onConflict: "dedupe_key" });
  if (!response.ok) throw new Error("O e-mail transacional não pôde ser enviado.");
  return { skipped: false as const, id: body.id as string };
}
