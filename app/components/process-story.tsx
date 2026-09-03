"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const stages = [
  {
    step: "01",
    label: "Projeto sem direção",
    title: "Tudo começa espalhado.",
    text: "Links, referências e boas práticas ficam em lugares diferentes. A IA recebe somente o que você lembrou naquele momento.",
    status: "Entrada dispersa",
    progress: 20,
  },
  {
    step: "02",
    label: "Skills selecionadas",
    title: "O design ganha critérios.",
    text: "Você escolhe direção visual, tipografia, acessibilidade e experiência antes de pedir que a IA construa.",
    status: "Direção visual",
    progress: 48,
  },
  {
    step: "03",
    label: "Camadas técnicas",
    title: "Segurança e desempenho entram no processo.",
    text: "As orientações de segurança, SEO e velocidade deixam de ser lembranças soltas e passam a fazer parte da execução.",
    status: "Camadas protegidas",
    progress: 76,
  },
  {
    step: "04",
    label: "Direção confirmada",
    title: "A IA recebe um plano revisado.",
    text: "Você confere o que será usado, separa skills de referências externas e envia um contexto claro para o chat.",
    status: "Pronto para executar",
    progress: 100,
  },
] as const;

const nodes = ["Referências", "Design", "Segurança", "Prompt"] as const;

export function ProcessStory() {
  const [active, setActive] = useState(0);
  const reducedMotion = useReducedMotion();
  const stageRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (reducedMotion) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
      if (disposed) return;
      const triggers = stageRefs.current.filter(Boolean).map((element, index) => ScrollTrigger.create({
        trigger: element,
        start: "top 58%",
        end: "bottom 42%",
        onEnter: () => setActive(index),
        onEnterBack: () => setActive(index),
      }));
      cleanup = () => triggers.forEach((trigger) => trigger.kill());
    });
    return () => { disposed = true; cleanup?.(); };
  }, [reducedMotion]);

  const stage = stages[active];

  return (
    <section className="process-story" id="como-funciona" aria-labelledby="process-story-title">
      <div className="process-story__visual">
        <div className="process-sticky">
          <div className="process-map" role="img" aria-label={`Etapa ${stage.step}: ${stage.status}`}>
            <svg viewBox="0 0 600 600" aria-hidden="true"><circle cx="300" cy="300" r="192"/><path d="M300 108V492M108 300H492M164 164L436 436M436 164L164 436"/></svg>
            <AnimatePresence mode="wait">
              <motion.div key={stage.step} className="process-core" initial={reducedMotion ? false : { opacity: 0, scale: .88, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={reducedMotion ? undefined : { opacity: 0, scale: 1.08, rotate: 8 }} transition={{ duration: .42 }}>
                <span>{stage.step}</span><strong>{stage.status}</strong><small>{stage.progress}% organizado</small>
              </motion.div>
            </AnimatePresence>
            {nodes.map((node, index) => <motion.span key={node} className={`process-node process-node--${index + 1}`} animate={{ opacity: index <= active ? 1 : .32, scale: index === active ? 1.08 : 1 }} transition={{ duration: .35 }}>{node}<i aria-hidden="true">{index <= active ? "✓" : "·"}</i></motion.span>)}
            <div className="process-progress" aria-hidden="true"><span style={{ transform: `scaleX(${stage.progress / 100})` }} /></div>
          </div>
          <p aria-live="polite"><span>{stage.label}</span><strong>{stage.status}</strong></p>
        </div>
      </div>
      <div className="process-story__steps">
        <header><p>Veja o processo mudar</p><h2 id="process-story-title">Cada escolha deixa a execução mais clara.</h2></header>
        {stages.map((item, index) => (
          <article key={item.step} ref={(element) => { stageRefs.current[index] = element; }} className={active === index ? "is-active" : ""} aria-current={active === index ? "step" : undefined} tabIndex={0} onFocus={() => setActive(index)} onPointerEnter={() => setActive(index)}>
            <span>{item.step}</span><p>{item.label}</p><h3>{item.title}</h3><div>{item.text}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
