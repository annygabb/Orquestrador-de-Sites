import { ProposalError, skillProposalSchema, submitSkillProposal, validateTurnstile } from "@/lib/skill-proposals";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentEntitlement } from "@/lib/entitlements";

export const runtime = "nodejs";

const attempts = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 3;

function clientIp(request: NextRequest) {
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) throw new ProposalError("Limite de propostas atingido. Tente novamente em até uma hora.", 429);
  recent.push(now);
  attempts.set(key, recent);
}

function validateOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin && process.env.NODE_ENV === "production") throw new ProposalError("Origem da solicitação não identificada.", 403);
  if (!origin) return;
  const allowed = new Set([
    process.env.APP_ORIGIN,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ].filter((value): value is string => Boolean(value)).map((value) => value.replace(/\/$/, "")));
  if (allowed.size > 0 && !allowed.has(origin.replace(/\/$/, ""))) throw new ProposalError("Origem não autorizada para enviar propostas.", 403);
}

export async function POST(request: NextRequest) {
  try {
    const entitlement = await currentEntitlement();
    if (!entitlement.allowed) throw new ProposalError("Ative a assinatura antes de enviar uma proposta.", 402, "SUBSCRIPTION_REQUIRED");
    validateOrigin(request);
    if (!request.headers.get("content-type")?.includes("application/json")) throw new ProposalError("Envie a proposta no formato JSON.", 415);
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 12_000) throw new ProposalError("A proposta excede o tamanho permitido.", 413);
    const ip = clientIp(request);
    checkRateLimit(ip);
    const proposal = skillProposalSchema.parse(await request.json());
    await validateTurnstile(proposal.turnstileToken, ip === "unknown" ? undefined : ip);
    const result = await submitSkillProposal(proposal);
    return NextResponse.json({
      success: true,
      message: "Skill enviada para aprovação",
      pullRequestNumber: result.pullRequestNumber,
      pullRequestUrl: result.pullRequestUrl,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof ProposalError) return NextResponse.json({ success: false, message: error.message, code: error.code }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, message: "Revise os campos da proposta e tente novamente." }, { status: 400 });
    console.error("[skill-proposal]", error);
    return NextResponse.json({ success: false, message: "Não foi possível enviar a skill para aprovação." }, { status: 500 });
  }
}
