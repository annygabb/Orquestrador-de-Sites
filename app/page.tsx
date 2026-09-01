import { SiteHeader } from "@/app/components/site-header";
import { currentUser } from "@/lib/entitlements";
import { ACTIVATION_PRICE_CENTS, RENEWAL_PRICE_CENTS, moneyFromCents } from "@/lib/billing";
import Link from "next/link";
import { MarketingSelectorDemo } from "@/app/components/marketing-selector-demo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await currentUser();
  return <><SiteHeader signedIn={Boolean(user)} /><main className="marketing-main">
    <section className="marketing-hero" aria-labelledby="hero-title">
      <div className="hero-copy"><p className="hero-context">Skills e referências para criação de sites com IA</p><h1 id="hero-title">Pare de recomeçar cada projeto do zero.</h1><p className="hero-lead">Escolha orientações confiáveis, confirme o processo e leve instruções claras para o chat ou site em que você já trabalha.</p><div className="hero-actions"><Link className="button button--primary button--large" href={user ? "/painel" : "/entrar?intent=signup"}>{user ? "Abrir painel" : "Criar conta"}</Link><a className="button button--outline button--large" href="#como-funciona">Ver o processo</a></div><p className="click-trigger">Ativação com 30 dias incluídos. Depois, renovação mensal cancelável.</p></div>
      <MarketingSelectorDemo />
    </section>

    <section className="transformation" id="como-funciona" aria-labelledby="transformation-title"><div className="transformation-copy"><h2 id="transformation-title">De links soltos para um processo que você consegue repetir.</h2><p>O valor aparece no momento em que você inicia ou revisa um site: menos procura dispersa, menos instrução esquecida e uma seleção explícita para cada objetivo.</p></div><ol className="process-list"><li><span>1</span><div><h3>Entre</h3><p>Acesse com Google e mantenha suas configurações vinculadas à sua conta.</p></div></li><li><span>2</span><div><h3>Escolha</h3><p>Combine skills executáveis com referências externas claramente identificadas.</p></div></li><li><span>3</span><div><h3>Confirme</h3><p>Nada entra no projeto silenciosamente. Você revisa antes de enviar ao chat.</p></div></li></ol></section>

    <section className="responsibility-split" aria-labelledby="responsibility-title"><div><h2 id="responsibility-title">Direto sobre o que existe e o que não existe.</h2><p>O sistema organiza instruções e fontes para orientar design, código, segurança, conteúdo e desempenho. Ele não promete receita, não copia identidades de terceiros e não chama referências externas de skills.</p></div><dl><div><dt>Responsável</dt><dd>Idealização e requisitos por Anny Gabrielly, @annygabb</dd></div><div><dt>Onde funciona</dt><dd>No site e em clientes de IA compatíveis com MCP, no computador ou celular.</dd></div><div><dt>Recursos priorizados</dt><dd>Skills por objetivo, revisão humana e referências oficiais de cada fonte.</dd></div><div><dt>Como é executado</dt><dd>Entrar, selecionar, conferir, confirmar e aplicar ao projeto.</dd></div></dl></section>

    <section className="pricing-section" id="plano" aria-labelledby="pricing-title"><div className="pricing-copy"><h2 id="pricing-title">Um começo completo. Uma renovação menor.</h2><p>A ativação cobre a preparação inicial e os primeiros 30 dias. A partir do segundo mês, você paga apenas pela continuidade do acesso.</p></div><article className="pricing-card"><div className="price-first"><span>Ativação + 30 dias</span><strong>{moneyFromCents(ACTIVATION_PRICE_CENTS)}</strong><small>pagamento inicial</small></div><div className="price-renewal"><span>Depois</span><strong>{moneyFromCents(RENEWAL_PRICE_CENTS)}<em>/mês</em></strong><small>renovação cancelável pelo perfil</small></div><ul><li>Painel completo de skills e referências</li><li>Uso pelo site e MCP enquanto o período estiver pago</li><li>Perfil com vencimento, valor e cancelamento</li><li>E-mails de cadastro, pagamento e situação da assinatura</li></ul><Link className="button button--primary button--large" href={user ? "/pagamento" : "/entrar?intent=signup"}>{user ? "Ativar acesso" : "Criar conta"}</Link><p>Sem nota fiscal automatizada nesta versão. Comprovantes e cobranças ficam no Asaas.</p></article></section>

    <section className="final-cta"><p>Escolha melhor antes de pedir que a IA construa.</p><Link className="button button--outline button--large" href={user ? "/painel" : "/entrar?intent=signup"}>{user ? "Abrir painel" : "Criar conta"}</Link></section>
  </main><footer className="site-footer"><p>Seu próximo site começa com decisões mais claras.</p><div><strong>Orquestrador de Sites</strong><span>© 2026, Anny Gabrielly</span><nav aria-label="Links do rodapé"><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos</Link><Link href="/reembolso">Reembolso</Link><Link href="/cookies">Cookies</Link><a href="https://github.com/annygabb/Orquestrador-de-Sites" target="_blank" rel="noopener noreferrer">GitHub</a></nav></div></footer></>;
}
