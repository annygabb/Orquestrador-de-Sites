import { cancelAsaasSubscription } from "@/lib/asaas";
import { sendLifecycleEmail } from "@/lib/email";
import { currentUser } from "@/lib/entitlements";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { hasTrustedOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ message: "Origem não autorizada." }, { status: 403 });
  const user = await currentUser();
  if (!user?.email) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });
  const admin = createAdminClient();
  const { data: subscription } = await admin.from("subscriptions").select("provider_subscription_id,cancel_at_period_end").eq("user_id", user.id).maybeSingle();
  if (!subscription) return NextResponse.json({ message: "Assinatura não encontrada." }, { status: 404 });
  if (!subscription.cancel_at_period_end && subscription.provider_subscription_id) await cancelAsaasSubscription(subscription.provider_subscription_id);
  await admin.from("subscriptions").update({ cancel_at_period_end: true, status: "canceled", canceled_at: new Date().toISOString() }).eq("user_id", user.id);
  await sendLifecycleEmail({ userId: user.id, email: user.email, name: user.user_metadata?.full_name, kind: "subscription_canceled", dedupeKey: `canceled:${user.id}:${subscription.provider_subscription_id || "manual"}` }).catch(() => undefined);
  return NextResponse.json({ success: true });
}
