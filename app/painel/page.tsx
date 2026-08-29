import SkillSelector from "@/app/components/skill-selector";
import { currentEntitlement, currentUser, requestEntitlement } from "@/lib/entitlements";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Painel · Orquestrador de Sites", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const incoming = await headers();
  const hasBearer = incoming.get("authorization")?.startsWith("Bearer os_");
  const user = await currentUser();
  if (!user && !hasBearer) redirect("/entrar");
  const entitlement = hasBearer
    ? await requestEntitlement(new Request("https://internal.local/painel", { headers: { authorization: incoming.get("authorization") || "" } }))
    : await currentEntitlement();
  if (!entitlement.allowed) return <main className="access-gate"><section><p>Acesso protegido</p><h1>Sua seleção continua salva. O uso está pausado.</h1><span>{entitlement.state === "overdue" ? "A renovação não foi confirmada." : "Ative o plano para abrir o painel e usar o plugin no chat."}</span><div><Link className="button button--primary" href="/pagamento">Regularizar acesso</Link><Link className="button button--outline" href="/perfil">Ver assinatura</Link></div></section></main>;
  return <SkillSelector />;
}
