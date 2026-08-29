import { createHash, randomBytes } from "node:crypto";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "./supabase/admin";
import { hasSupabaseConfig } from "./supabase/config";
import { createClient } from "./supabase/server";
import { subscriptionEntitlement, type Entitlement, type EntitlementState, type SubscriptionRow } from "./subscription-access";

export { subscriptionEntitlement } from "./subscription-access";
export type { Entitlement, EntitlementState } from "./subscription-access";

async function entitlementForUser(userId: string): Promise<Entitlement> {
  const admin = createAdminClient();
  const [{ data: profile }, { data: subscription }] = await Promise.all([
    admin.from("profiles").select("is_admin").eq("id", userId).maybeSingle(),
    admin.from("subscriptions").select("status,paid_until,next_due_date,cancel_at_period_end").eq("user_id", userId).maybeSingle(),
  ]);
  if (profile?.is_admin) return { allowed: true, state: "active", userId };
  return { ...subscriptionEntitlement(subscription as SubscriptionRow | null), userId };
}

export async function currentUser(): Promise<User | null> {
  if (!hasSupabaseConfig()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function currentEntitlement(): Promise<Entitlement> {
  const user = await currentUser();
  if (!user) return { allowed: false, state: "inactive" };
  return entitlementForUser(user.id);
}

export function hashAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createAccessToken() {
  const plain = `os_${randomBytes(30).toString("base64url")}`;
  return { plain, hash: hashAccessToken(plain), prefix: plain.slice(0, 10) };
}

export async function requestEntitlement(request: Request): Promise<Entitlement> {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer os_")) {
    const admin = createAdminClient();
    const tokenHash = hashAccessToken(authorization.slice(7));
    const { data } = await admin.from("access_tokens").select("user_id,revoked_at").eq("token_hash", tokenHash).is("revoked_at", null).maybeSingle();
    if (!data) return { allowed: false, state: "inactive" };
    await admin.from("access_tokens").update({ last_used_at: new Date().toISOString() }).eq("token_hash", tokenHash);
    return entitlementForUser(data.user_id);
  }
  return currentEntitlement();
}

export function entitlementResponse(entitlement: Entitlement) {
  return Response.json({
    error: "subscription_required",
    message: entitlement.state === "overdue"
      ? "O pagamento está em atraso. Regularize a assinatura para voltar a usar o Orquestrador."
      : "É necessário ter uma assinatura ativa para usar este recurso.",
    state: entitlement.state,
    manageUrl: "/perfil",
  }, { status: 402 });
}
