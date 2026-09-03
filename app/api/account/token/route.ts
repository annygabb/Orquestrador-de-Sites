import { createAccessToken, currentEntitlement, currentUser } from "@/lib/entitlements";
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
  if (!user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });
  if (!await sensitiveActionHasRequiredMfa()) return NextResponse.json({ message: "Confirme o 2FA novamente no perfil." }, { status: 403 });
  if (!await consumeRateLimit({ bucket: "access-token", identity: `${user.id}:${requestIp(request)}`, limit: 5, windowSeconds: 3600 })) return NextResponse.json({ message: "Muitas tentativas. Aguarde uma hora." }, { status: 429 });
  const entitlement = await currentEntitlement();
  if (!entitlement.allowed) return NextResponse.json({ message: "Ative a assinatura antes de gerar uma chave." }, { status: 402 });
  const admin = createAdminClient();
  const token = createAccessToken();
  await admin.from("access_tokens").update({ revoked_at: new Date().toISOString() }).eq("user_id", user.id).is("revoked_at", null);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await admin.from("access_tokens").insert({ user_id: user.id, token_hash: token.hash, token_prefix: token.prefix, expires_at: expiresAt });
  await auditAction(request, { userId: user.id, action: "access_token.rotate", resource: "mcp_token", outcome: "success" });
  return NextResponse.json({ token: token.plain, expiresAt }, { headers: { "Cache-Control": "no-store, private" } });
}
