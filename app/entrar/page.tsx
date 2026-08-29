import { signInWithGoogle } from "@/app/actions/auth";
import { SiteHeader } from "@/app/components/site-header";
import { currentUser } from "@/lib/entitlements";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Entrar · Orquestrador de Sites", description: "Entre com Google para acessar o Orquestrador de Sites." };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const user = await currentUser();
  if (user) redirect("/perfil");
  const { erro } = await searchParams;
  const configured = hasSupabaseConfig();
  return <><SiteHeader /><main className="auth-page"><section className="auth-card"><div className="auth-copy"><p className="auth-kicker">Acesso pessoal</p><h1>Entre e mantenha seu processo no mesmo lugar.</h1><p>Sua conta liga o painel, a assinatura e o acesso pelo chat sem expor credenciais no navegador.</p></div><div className="auth-action"><form action={signInWithGoogle}><button className="button button--google" disabled={!configured} type="submit"><span aria-hidden="true">G</span> Continuar com Google</button></form>{!configured && <p role="alert">O login ainda precisa das variáveis do Supabase. Consulte o README antes de testar.</p>}{erro && <p role="alert">Não foi possível concluir o login. Confira os callbacks do Google e tente novamente.</p>}<small>Ao continuar, você autoriza o uso da conta Google somente para autenticação.</small><Link href="/">Voltar à apresentação</Link></div></section></main></>;
}
