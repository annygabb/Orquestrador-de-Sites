import { signInWithGoogle } from "@/app/actions/auth";
import { SiteHeader } from "@/app/components/site-header";
import { currentUser } from "@/lib/entitlements";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Entrar · Orquestrador de Sites", description: "Entre com Google para acessar o Orquestrador de Sites." };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string; intent?: string }> }) {
  const user = await currentUser();
  if (user) redirect("/perfil");
  const { erro, intent } = await searchParams;
  const creating = intent === "signup";
  const configured = hasSupabaseConfig();
  return <><SiteHeader /><main className="auth-page auth-page--focused"><section className="auth-card auth-card--focused"><Link className="auth-logo" href="/" aria-label="Voltar para a página inicial"><span aria-hidden="true">OS</span><strong>Orquestrador</strong></Link><div className="auth-focused__intro"><h1>{creating ? "Entre ou crie sua conta" : "Que bom ter você de volta"}</h1><p>{creating ? "Um acesso para organizar seus projetos no site e no chat." : "Entre com a mesma conta usada no seu painel."}</p></div><div className="auth-action auth-action--focused"><form action={signInWithGoogle}><button className="button button--google" disabled={!configured} type="submit"><span className="google-mark" aria-hidden="true">G</span>{creating ? "Continuar com Google" : "Entrar com Google"}</button></form>{!configured && <p role="alert">O login ainda precisa das variáveis do Supabase. Consulte o README antes de testar.</p>}{erro && <p role="alert">Não foi possível concluir o login. Confira os callbacks do Google e tente novamente.</p>}<div className="auth-security"><span aria-hidden="true" />Sessão protegida por cookie seguro. Não guardamos outra senha.</div><small>Ao continuar, você concorda com os <Link href="/termos">Termos de uso</Link> e a <Link href="/privacidade">Política de privacidade</Link>.</small></div></section></main></>;
}
