import { signOut } from "@/app/actions/auth";
import { SiteHeader } from "@/app/components/site-header";
import { StatusPill } from "@/app/components/status-pill";
import { SubscriptionActions } from "@/app/components/subscription-actions";
import { TokenManager } from "@/app/components/token-manager";
import { RENEWAL_PRICE_CENTS, moneyFromCents } from "@/lib/billing";
import { currentEntitlement, currentUser } from "@/lib/entitlements";
import Link from "next/link";
import { redirect } from "next/navigation";

function date(value?: string | null) { return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(value)) : "—"; }

export const metadata = { title: "Meu perfil", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) redirect("/entrar");
  const entitlement = await currentEntitlement();
  return <><SiteHeader signedIn /><main className="profile-shell"><header className="profile-head"><div><p>Minha conta</p><h1>{user.user_metadata?.full_name || "Seu perfil"}</h1><span>{user.email}</span></div><StatusPill state={entitlement.state} /></header><section className="profile-grid"><article><h2>Assinatura</h2><dl><div><dt>Próxima renovação</dt><dd>{date(entitlement.nextDueDate)}</dd></div><div><dt>Período pago até</dt><dd>{date(entitlement.paidUntil)}</dd></div><div><dt>Valor da renovação</dt><dd>{moneyFromCents(RENEWAL_PRICE_CENTS)}</dd></div><div><dt>Renovação</dt><dd>{entitlement.cancelAtPeriodEnd ? "Cancelada ao fim do período" : entitlement.allowed ? "Ativa" : "Não ativa"}</dd></div></dl>{entitlement.allowed ? <SubscriptionActions canCancel={!entitlement.cancelAtPeriodEnd} /> : <Link className="button button--primary" href="/pagamento">Ativar ou regularizar</Link>}</article><article><h2>Acesso pelo chat</h2><TokenManager enabled={entitlement.allowed} /></article></section><section className="profile-foot"><Link className="button button--outline" href={entitlement.allowed ? "/painel" : "/pagamento"}>{entitlement.allowed ? "Abrir painel" : "Regularizar acesso"}</Link><form action={signOut}><button className="button button--quiet" type="submit">Sair da conta</button></form></section></main></>;
}
