import { createHash } from "node:crypto";
import { createAdminClient } from "./supabase/admin";
import { requestIp } from "./rate-limit";

export async function auditAction(request: Request, input: { userId?: string | null; action: string; resource?: string; outcome: "success" | "denied" | "failed"; metadata?: Record<string, string | number | boolean | null> }) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const salt = process.env.AUDIT_LOG_SALT ?? process.env.RATE_LIMIT_SALT ?? "local-only";
  const ipHash = createHash("sha256").update(`${salt}:${requestIp(request)}`).digest("hex");
  const event = { request_id: requestId, action: input.action, resource_type: input.resource ?? null, outcome: input.outcome, actor_user_id: input.userId ?? null, ip_hash: ipHash, metadata: input.metadata ?? {} };
  console.info(JSON.stringify({ level: "info", event: "audit", ...event }));
  try {
    await createAdminClient().from("audit_logs").insert(event);
  } catch {
    // Audit persistence must not expose data or break the primary operation.
  }
}
