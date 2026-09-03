import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const started = performance.now();
  try {
    const { error } = await createAdminClient().from("profiles").select("id", { head: true, count: "exact" }).limit(1);
    if (error) throw error;
    return NextResponse.json({ status: "ok", version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local", database: "reachable", latencyMs: Math.round(performance.now() - started) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "degraded", database: "unreachable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
