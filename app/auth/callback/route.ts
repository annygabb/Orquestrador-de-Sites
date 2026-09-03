import { sendLifecycleEmail } from "@/lib/email";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = (process.env.APP_ORIGIN || url.origin).replace(/\/$/, "");
  const code = url.searchParams.get("code");
  if (!code || !hasSupabaseConfig()) return NextResponse.redirect(`${origin}/entrar?erro=callback`);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/entrar?erro=callback`);
  await sendLifecycleEmail({ userId: data.user.id, email: data.user.email || "", name: data.user.user_metadata?.full_name, kind: "welcome", dedupeKey: `welcome:${data.user.id}` }).catch(() => undefined);
  return NextResponse.redirect(`${origin}/perfil?boas-vindas=1`);
}
