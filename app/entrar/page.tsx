import { signInWithGoogle } from "@/app/actions/auth";
import { currentUser } from "@/lib/entitlements";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { redirect } from "next/navigation";
import { AuthPage } from "@/components/ui/auth-page";

export const metadata = { title: "Entrar · Orquestrador de Sites", description: "Entre com Google para acessar o Orquestrador de Sites." };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string; intent?: string }> }) {
  const user = await currentUser();
  if (user) redirect("/perfil");
  const { erro, intent } = await searchParams;
  const creating = intent === "signup";
  const configured = hasSupabaseConfig();
  return <AuthPage creating={creating} configured={configured} error={erro} action={signInWithGoogle} />;
}
