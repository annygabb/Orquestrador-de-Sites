import { createHash } from "node:crypto";
import { cancelAsaasSubscription } from "@/lib/asaas";
import { auditAction } from "@/lib/audit";
import { hasValidCsrf } from "@/lib/csrf";
import { currentUser } from "@/lib/entitlements";
import { consumeRateLimit, requestIp } from "@/lib/rate-limit";
import { hasTrustedOrigin } from "@/lib/request-security";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sensitiveActionHasRequiredMfa } from "@/lib/mfa";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const schema = z.object({ confirmation: z.literal("EXCLUIR") });

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request) || !await hasValidCsrf(request)) return NextResponse.json({ message: "Sessão de formulário inválida." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });
  if (!await sensitiveActionHasRequiredMfa()) return NextResponse.json({ message: "Confirme o 2FA novamente antes de excluir a conta." }, { status: 403 });
  if (!await consumeRateLimit({ bucket: "account-delete", identity: `${user.id}:${requestIp(request)}`, limit: 3, windowSeconds: 86400 })) return NextResponse.json({ message: "Limite de tentativas atingido." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Digite EXCLUIR para confirmar." }, { status: 400 });

  const deletionSalt = process.env.USER_DELETION_SALT ?? process.env.AUDIT_LOG_SALT;
  if (!deletionSalt && process.env.NODE_ENV === "production") return NextResponse.json({ message: "Exclusão indisponível: política de anonimização não configurada." }, { status: 503 });

  const admin = createAdminClient();
  const { data: subscription } = await admin.from("subscriptions").select("provider_subscription_id").eq("user_id", user.id).maybeSingle();
  if (subscription?.provider_subscription_id) await cancelAsaasSubscription(subscription.provider_subscription_id).catch(() => undefined);
  const userHash = createHash("sha256").update(`${deletionSalt ?? "local-only"}:${user.id}`).digest("hex");
  await admin.from("privacy_deletions").upsert({ user_hash: userHash, requested_at: new Date().toISOString(), completed_at: new Date().toISOString(), backup_purge_after: new Date(Date.now() + 30 * 86400000).toISOString() }, { onConflict: "user_hash" });
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ message: "Não foi possível concluir a exclusão. O suporte foi avisado." }, { status: 500 });
  await auditAction(request, { userId: user.id, action: "account.delete", resource: "account", outcome: "success" });
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
  return NextResponse.json({ success: true });
}
