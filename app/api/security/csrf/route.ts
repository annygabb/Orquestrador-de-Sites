import { currentUser } from "@/lib/entitlements";
import { newCsrfToken, setCsrfCookie } from "@/lib/csrf";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });
  const token = newCsrfToken();
  await setCsrfCookie(token);
  return NextResponse.json({ token }, { headers: { "Cache-Control": "no-store, private" } });
}
