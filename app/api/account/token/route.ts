import { createAccessToken, currentEntitlement, currentUser } from "@/lib/entitlements";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { hasTrustedOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ message: "Origem não autorizada." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });
  const entitlement = await currentEntitlement();
  if (!entitlement.allowed) return NextResponse.json({ message: "Ative a assinatura antes de gerar uma chave." }, { status: 402 });
  const admin = createAdminClient();
  const token = createAccessToken();
  await admin.from("access_tokens").update({ revoked_at: new Date().toISOString() }).eq("user_id", user.id).is("revoked_at", null);
  await admin.from("access_tokens").insert({ user_id: user.id, token_hash: token.hash, token_prefix: token.prefix });
  return NextResponse.json({ token: token.plain });
}
