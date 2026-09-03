import { createClient } from "./supabase/server";

export async function sensitiveActionHasRequiredMfa() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return false;
  return data.nextLevel !== "aal2" || data.currentLevel === "aal2";
}
