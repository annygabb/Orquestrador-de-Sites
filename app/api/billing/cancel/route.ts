import { cancelAsaasSubscription } from "@/lib/asaas";
import { sendLifecycleEmail } from "@/lib/email";
import { currentUser } from "@/lib/entitlements";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { hasTrustedOrigin } from "@/lib/request-security";
import { hasValidCsrf } from "@/lib/csrf";
import { consumeRateLimit, requestIp } from "@/lib/rate-limit";
import { sensitiveActionHasRequiredMfa } from "@/lib/mfa";
import { auditAction } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request) || !await hasValidCsrf(request)) return NextResponse.json({ message: "Sessão de formulário inválida." }, { status: 403 });
  const user = await currentUser();
  if (!user?.email) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });
  if (!await sensitiveActionHasRequiredMfa()) return NextResponse.json({ message: "Confirme o 2FA novamente no perfil." }, { status: 403 });
  if (!await consumeRateLimit({ bucket: "billing-cancel", identity: `${user.id}:${requestIp(request)}`, limit: 5, windowSeconds: 3600 })) return NextResponse.json({ message: "Muitas tentativas. Aguarde uma hora." }, { status: 429 });
  const admin = createAdminClient();
  const { data: subscription } = await admin.from("subscriptions").select("provider_subscription_id,cancel_at_period_end").eq("user_id", user.id).maybeSingle();
  if (!subscription) return NextResponse.json({ message: "Assinatura não encontrada." }, { status: 404 });
  if (!subscription.cancel_at_period_end && subscription.provider_subscription_id) await cancelAsaasSubscription(subscription.provider_subscription_id);
  await admin.from("subscriptions").update({ cancel_at_period_end: true, status: "canceled", canceled_at: new Date().toISOString() }).eq("user_id", user.id);
  await auditAction(request, { userId: user.id, action: "subscription.cancel", resource: "subscription", outcome: "success" });
  await sendLifecycleEmail({ userId: user.id, email: user.email, name: user.user_metadata?.full_name, kind: "subscription_canceled", dedupeKey: `canceled:${user.id}:${subscription.provider_subscription_id || "manual"}` }).catch(() => undefined);
  return NextResponse.json({ success: true });
}
