import { BillingForm } from "@/app/components/billing-form";
import { SiteHeader } from "@/app/components/site-header";
import { currentEntitlement, currentUser } from "@/lib/entitlements";
import { ACTIVATION_PRICE_CENTS, RENEWAL_PRICE_CENTS, moneyFromCents } from "@/lib/billing";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Ativar acesso", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PaymentPage() {
  const user = await currentUser();
  if (!user) redirect("/entrar?intent=signup");
  const entitlement = await currentEntitlement();
  if (entitlement.allowed) redirect("/perfil");
  return <><SiteHeader signedIn /><main className="account-shell"><section className="checkout-intro"><p>Pagamento protegido pelo Asaas</p><h1>Ative o acesso por {moneyFromCents(ACTIVATION_PRICE_CENTS)}.</h1><span>Esse pagamento libera 30 dias. Depois, a renovação é de {moneyFromCents(RENEWAL_PRICE_CENTS)} por mês e pode ser cancelada no perfil.</span></section><section className="checkout-card"><BillingForm defaultName={user.user_metadata?.full_name || ""} /><p>Você será levado ao ambiente seguro do Asaas para escolher Pix, boleto ou cartão conforme a disponibilidade da cobrança. O acesso só é liberado após confirmação pelo webhook.</p><Link href="/perfil">Voltar ao perfil</Link></section></main></>;
}
