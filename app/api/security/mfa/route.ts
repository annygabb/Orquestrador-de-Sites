import { hasValidCsrf } from "@/lib/csrf";
import { currentUser } from "@/lib/entitlements";
import { consumeRateLimit, requestIp } from "@/lib/rate-limit";
import { hasTrustedOrigin } from "@/lib/request-security";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("enroll") }),
  z.object({ action: z.literal("verify"), factorId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) }),
  z.object({ action: z.literal("unenroll"), factorId: z.string().uuid() }),
]);

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return NextResponse.json({ message: "Não foi possível consultar o MFA." }, { status: 500 });
  return NextResponse.json({ factors: data.totp.map(({ id, status, friendly_name }) => ({ id, status, friendlyName: friendly_name })) }, { headers: { "Cache-Control": "no-store, private" } });
}

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request) || !await hasValidCsrf(request)) return NextResponse.json({ message: "Sessão de formulário inválida." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });
  if (!await consumeRateLimit({ bucket: "mfa", identity: `${user.id}:${requestIp(request)}`, limit: 8, windowSeconds: 900 })) return NextResponse.json({ message: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ message: "Dados de MFA inválidos." }, { status: 400 });
  const supabase = await createClient();
  if (input.data.action === "enroll") {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Orquestrador de Sites" });
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret }, { headers: { "Cache-Control": "no-store, private" } });
  }
  if (input.data.action === "verify") {
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: input.data.factorId, code: input.data.code });
    if (error) return NextResponse.json({ message: "Código inválido ou expirado." }, { status: 400 });
    return NextResponse.json({ success: true });
  }
  const { error } = await supabase.auth.mfa.unenroll({ factorId: input.data.factorId });
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
