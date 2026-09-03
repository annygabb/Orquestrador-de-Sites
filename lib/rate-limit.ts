import { createHash } from "node:crypto";
import { createAdminClient } from "./supabase/admin";

export function requestIp(request: Request) {
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}

function identityHash(value: string) {
  const salt = process.env.RATE_LIMIT_SALT;
  if (!salt && process.env.NODE_ENV === "production") throw new Error("RATE_LIMIT_SALT não configurado.");
  return createHash("sha256").update(`${salt ?? "local-only"}:${value}`).digest("hex");
}

export async function consumeRateLimit(input: { bucket: string; identity: string; limit: number; windowSeconds: number }) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_rate_limit", {
    p_bucket: input.bucket,
    p_identity_hash: identityHash(input.identity),
    p_limit: input.limit,
    p_window_seconds: input.windowSeconds,
  });
  if (error) throw error;
  return Boolean(data);
}
