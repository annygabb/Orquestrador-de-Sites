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
  return <><SiteHeader /><main className="auth-page"><section className="auth-card auth-card--modern"><div className="auth-copy"><p className="auth-kicker">{creating ? "Comece pelo seu processo" : "Seu painel está esperando"}</p><h1>{creating ? "Crie sua conta sem criar outra senha." : "Continue de onde você parou."}</h1><p>{creating ? "Use o Google para abrir seu espaço pessoal e conhecer o painel antes da ativação." : "Entre com a mesma conta Google para acessar seleção, assinatura e configurações."}</p><div className="auth-route" aria-label="Etapas depois do acesso"><div><span>Agora</span><strong>Entrar com Google</strong></div><div><span>Depois</span><strong>Explorar o painel</strong></div><div><span>Quando decidir</span><strong>Ativar o acesso</strong></div></div></div><div className="auth-action"><div className="auth-action__head"><span>{creating ? "Criar conta" : "Entrar"}</span><h2>{creating ? "Um clique para começar." : "Acesso seguro e direto."}</h2><p>Não guardamos senha no Orquestrador. A autenticação é feita pelo Google e a sessão usa cookie protegido.</p></div><form action={signInWithGoogle}><button className="button button--google" disabled={!configured} type="submit"><span aria-hidden="true">G</span>{creating ? "Criar conta com Google" : "Continuar com Google"}</button></form>{!configured && <p role="alert">O login ainda precisa das variáveis do Supabase. Consulte o README antes de testar.</p>}{erro && <p role="alert">Não foi possível concluir o login. Confira os callbacks do Google e tente novamente.</p>}<ul className="auth-assurance"><li>Sem senha adicional</li><li>Sessão protegida no navegador</li><li>Você pode excluir a conta pelo perfil</li></ul><small>Ao continuar, você concorda com os <Link href="/termos">Termos de uso</Link> e a <Link href="/privacidade">Política de privacidade</Link>.</small><Link className="auth-back" href="/">Voltar à apresentação</Link></div></section></main></>;
}
