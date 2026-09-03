import { SiteHeader } from "@/app/components/site-header";
import { currentUser } from "@/lib/entitlements";
import { ACTIVATION_PRICE_CENTS, RENEWAL_PRICE_CENTS, moneyFromCents } from "@/lib/billing";
import Link from "next/link";
import { MarketingSelectorDemo } from "@/app/components/marketing-selector-demo";
import { TimeEstimator } from "@/app/components/time-estimator";
import { MarketingMotion } from "@/app/components/marketing-motion";
import { PagePreloader } from "@/app/components/page-preloader";
import { ProcessStory } from "@/app/components/process-story";
import { ShaderHero } from "@/components/ui/shader-hero";
import { MovingBorderButton } from "@/components/ui/moving-border";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await currentUser();
  const accountLink = user ? "/painel" : "/entrar?intent=signup";

  return <>
    <PagePreloader />
    <MarketingMotion />
    <SiteHeader signedIn={Boolean(user)} />
    <main className="sales-page">
      <section className="sales-hero" aria-labelledby="hero-title" data-marketing-hero>
        <div className="sales-hero__visual" data-hero-reveal><ShaderHero /></div>
        <div className="sales-hero__copy">
          <p className="sales-eyebrow" data-hero-reveal><span>PARA QUEM CRIA SITES COM IA</span><b>Sem improviso entre o briefing e o prompt.</b></p>
          <h1 id="hero-title" data-hero-reveal>Transforme referências soltas em uma direção que a IA entende.</h1>
          <p className="sales-hero__lead" data-hero-reveal>Escolha as skills, confirme os critérios e entregue para a IA um plano revisado — sem perder horas abrindo abas ou refazendo decisões.</p>
          <div className="sales-hero__actions" data-hero-reveal>
            <MovingBorderButton as="a" href={accountLink} containerClassName="moving-cta" className="moving-cta__inside moving-cta__inside--primary">{user ? "Abrir meu painel" : "Organizar meu próximo site"}<span aria-hidden="true">↗</span></MovingBorderButton>
            <MovingBorderButton as="a" href="#como-funciona" containerClassName="moving-cta" className="moving-cta__inside moving-cta__inside--secondary">Ver a transformação</MovingBorderButton>
          </div>
          <ul className="sales-proofline" data-hero-reveal><li>Você escolhe</li><li>O sistema organiza</li><li>A IA executa com contexto</li></ul>
        </div>
        <svg className="hero-draw-line" viewBox="0 0 900 120" fill="none" aria-hidden="true"><path d="M4 97C163 3 270 118 424 53C576-12 677 104 896 17" pathLength="1" /></svg>
      </section>

      <section className="demand-strip" aria-label="Demandas organizadas pelo sistema">
        <div className="demand-track">
          <div className="demand-group"><span>DESIGN</span><span>SEGURANÇA</span><span>SEO</span><span>PERFORMANCE</span><span>CONVERSÃO</span><span>ACESSIBILIDADE</span></div>
          <div className="demand-group" aria-hidden="true"><span>DESIGN</span><span>SEGURANÇA</span><span>SEO</span><span>PERFORMANCE</span><span>CONVERSÃO</span><span>ACESSIBILIDADE</span></div>
        </div>
      </section>

      <ProcessStory />

      <section className="results-lab" id="impacto" aria-labelledby="results-title">
        <header data-reveal><p>Impacto que você consegue medir</p><h2 id="results-title">Troque horas procurando por decisões que avançam o projeto.</h2><span>Use seus próprios números. O simulador mostra uma possibilidade de economia de tempo, não uma promessa de resultado.</span></header>
        <div className="results-lab__grid">
          <TimeEstimator />
          <article className="gain-dashboard" data-reveal>
            <div className="gain-dashboard__head"><div><span>PAINEL DE IMPACTO</span><strong>Antes × depois</strong></div><b>Simulação</b></div>
            <div className="gain-kpis"><div><span>Busca dispersa</span><strong>5h</strong><small>por projeto</small></div><div className="is-highlighted"><span>Processo organizado</span><strong>2h</strong><small>por projeto</small></div></div>
            <div className="gain-chart" role="img" aria-label="Gráfico ilustrativo mostrando redução gradual de cinco para duas horas de organização por projeto">
              <svg viewBox="0 0 560 220" preserveAspectRatio="none"><defs><linearGradient id="gainFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".38"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs><path className="gain-chart__area" d="M0 36C90 52 120 80 188 96C280 119 338 126 410 164C470 196 522 184 560 188V220H0Z"/><path className="gain-chart__line" pathLength="1" d="M0 36C90 52 120 80 188 96C280 119 338 126 410 164C470 196 522 184 560 188"/></svg>
              <span className="gain-dot gain-dot--start">5h</span><span className="gain-dot gain-dot--end">2h</span>
            </div>
            <p>Exemplo visual. O resultado real depende da complexidade e da sua rotina.</p>
          </article>
        </div>
      </section>

      <section className="selector-sales" id="experimente" aria-labelledby="selector-title">
        <div className="selector-sales__copy" data-reveal><p>Teste antes de criar a conta</p><h2 id="selector-title">Escolha o que o próximo site precisa.</h2><span>Cada item explica se executa uma ação ou serve apenas como referência. Nada entra no projeto sem a sua confirmação.</span><Link className="text-action" href={accountLink}>{user ? "Abrir painel completo" : "Continuar com uma conta"}<b aria-hidden="true">→</b></Link></div>
        <div data-reveal><MarketingSelectorDemo /></div>
      </section>

      <section className="why-pay" aria-labelledby="why-title">
        <div className="why-pay__intro" data-reveal><p>Por que assinar</p><h2 id="why-title">Você não paga por uma lista. Paga para <mark>não recomeçar do zero.</mark></h2></div>
        <div className="why-pay__items">
          <article data-reveal><span>01</span><h3>Menos retrabalho</h3><p>Critérios de design, segurança e desempenho entram antes da execução.</p></article>
          <article data-reveal><span>02</span><h3>Mais clareza no chat</h3><p>A IA recebe objetivo, limites, skills e referências em uma direção revisada.</p></article>
          <article data-reveal><span>03</span><h3>Um processo reaproveitável</h3><p>O que funcionou deixa de ficar perdido e pode orientar o próximo projeto.</p></article>
          <article data-reveal><span>04</span><h3>Decisão continua humana</h3><p>O sistema sugere e organiza. Você confirma o que realmente será usado.</p></article>
        </div>
      </section>

      <section className="pricing-section sales-pricing" id="plano" aria-labelledby="pricing-title">
        <div className="pricing-copy" data-reveal><p className="sales-section-label">UM COMEÇO COMPLETO</p><h2 id="pricing-title">Organize o processo agora. Continue por menos depois.</h2><span>A ativação inclui 30 dias para montar, testar e usar o fluxo completo. Depois, você decide se quer manter o acesso.</span></div>
        <article className="pricing-card" data-reveal><div className="price-first"><span>Ativação + 30 dias</span><strong>{moneyFromCents(ACTIVATION_PRICE_CENTS)}</strong><small>pagamento inicial</small></div><div className="price-renewal"><span>Depois</span><strong>{moneyFromCents(RENEWAL_PRICE_CENTS)}<em>/mês</em></strong><small>cancelável pelo perfil</small></div><ul><li>Painel de skills e referências</li><li>Uso no site e em clientes compatíveis com MCP</li><li>Perfil com valor, vencimento e cancelamento</li><li>Avisos sobre cadastro, pagamento e acesso</li></ul><MovingBorderButton as="a" href={user ? "/pagamento" : "/entrar?intent=signup"} containerClassName="moving-cta moving-cta--wide" className="moving-cta__inside moving-cta__inside--primary">{user ? "Ativar acesso" : "Criar minha conta"}<span aria-hidden="true">↗</span></MovingBorderButton></article>
      </section>

      <section className="sales-final" data-reveal><p>Seu próximo site não precisa começar em vinte abas.</p><h2>Comece com uma direção.</h2><MovingBorderButton as="a" href={accountLink} containerClassName="moving-cta" className="moving-cta__inside moving-cta__inside--primary">{user ? "Abrir painel" : "Criar conta"}<span aria-hidden="true">↗</span></MovingBorderButton></section>
    </main>
    <footer className="site-footer"><p>Seu próximo site começa com decisões mais claras.</p><div><strong>Orquestrador de Sites</strong><span>© 2026, Anny Gabrielly</span><nav aria-label="Links do rodapé"><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos</Link><Link href="/reembolso">Reembolso</Link><Link href="/cookies">Cookies</Link><a href="https://github.com/annygabb/Orquestrador-de-Sites" target="_blank" rel="noopener noreferrer">GitHub</a></nav></div></footer>
  </>;
}
