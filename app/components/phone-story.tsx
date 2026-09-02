"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const stages = [
  {
    step: "01",
    label: "Projeto sem direção",
    title: "Tudo começa espalhado.",
    text: "Links, referências e boas práticas ficam em lugares diferentes. A IA recebe somente o que você lembrou naquele momento.",
    status: "12 referências soltas",
    progress: 18,
    cards: ["Brief incompleto", "Fontes sem critério", "Revisão tardia"],
  },
  {
    step: "02",
    label: "Skills selecionadas",
    title: "O design ganha critérios.",
    text: "Você escolhe direção visual, tipografia, acessibilidade e experiência antes de pedir que a IA construa.",
    status: "Design organizado",
    progress: 46,
    cards: ["Hierarquia visual", "Mobile primeiro", "Contraste revisado"],
  },
  {
    step: "03",
    label: "Camadas técnicas",
    title: "Segurança e desempenho entram no processo.",
    text: "As orientações de segurança, SEO e velocidade deixam de ser lembranças soltas e passam a fazer parte da execução.",
    status: "Critérios protegidos",
    progress: 73,
    cards: ["Validação e CSP", "PageSpeed e SEO", "Testes antes do deploy"],
  },
  {
    step: "04",
    label: "Direção confirmada",
    title: "A IA recebe um plano revisado.",
    text: "Você confere o que será usado, separa skills de referências externas e envia um contexto claro para o chat.",
    status: "Pronto para executar",
    progress: 100,
    cards: ["Objetivo definido", "Seleção confirmada", "Prompt pronto"],
  },
] as const;

export function PhoneStory({ compact = false }: { compact?: boolean }) {
  const [active, setActive] = useState(compact ? 3 : 0);
  const reducedMotion = useReducedMotion();
  const stageRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (compact || reducedMotion) return;
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
  }, [compact, reducedMotion]);

  const stage = stages[active];
  const phone = (
    <div className="phone-scene" data-phone-stage={active}>
      <div className="phone-aura" aria-hidden="true" />
      <motion.div className="phone-device" animate={reducedMotion ? undefined : { rotateY: compact ? -9 : -5 + active * 2, rotateX: compact ? 5 : 7 - active, y: compact ? 0 : active % 2 ? -8 : 0 }} transition={{ duration: .7, ease: [0.16, 1, 0.3, 1] }}>
        <Image src="/orquestrador-phone.jpg" alt="Celular exibindo a evolução de um projeto organizado pelo Orquestrador" width={736} height={822} priority={compact} sizes={compact ? "(max-width: 768px) 90vw, 44vw" : "(max-width: 900px) 82vw, 40vw"} />
        <div className="phone-screen">
          <AnimatePresence mode="wait">
            <motion.div key={stage.step} className="phone-ui" initial={reducedMotion ? false : { opacity: 0, y: 20, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reducedMotion ? undefined : { opacity: 0, y: -12, scale: 1.02 }} transition={{ duration: .38 }}>
              <header><span>OS / PROJETO</span><b>{stage.step}/04</b></header>
              <div className="phone-ui__status"><i aria-hidden="true" /><span>{stage.status}</span></div>
              <strong>{stage.title}</strong>
              <div className="phone-ui__cards">
                {stage.cards.map((card, index) => <motion.span key={card} initial={reducedMotion ? false : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .07 }}>{card}<b aria-hidden="true">✓</b></motion.span>)}
              </div>
              <div className="phone-ui__progress"><span style={{ width: `${stage.progress}%` }} /></div>
              <small>{stage.progress}% da direção organizada</small>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
      <motion.div className="skill-chip skill-chip--design" animate={reducedMotion ? undefined : { y: [0, -7, 0] }} transition={{ duration: 4, repeat: Infinity }}>Design</motion.div>
      <motion.div className="skill-chip skill-chip--security" animate={reducedMotion ? undefined : { y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity }}>Segurança</motion.div>
      <motion.div className="skill-chip skill-chip--speed" animate={reducedMotion ? undefined : { y: [0, -5, 0] }} transition={{ duration: 4.6, repeat: Infinity }}>Performance</motion.div>
    </div>
  );

  if (compact) return phone;

  return (
    <section className="phone-story" id="como-funciona" aria-labelledby="phone-story-title">
      <div className="phone-story__visual"><div className="phone-sticky">{phone}<p aria-live="polite"><span>{stage.label}</span><strong>{stage.status}</strong></p></div></div>
      <div className="phone-story__steps">
        <header><p>Veja o processo mudar</p><h2 id="phone-story-title">Cada skill melhora uma parte visível do projeto.</h2></header>
        {stages.map((item, index) => (
          <article key={item.step} ref={(element) => { stageRefs.current[index] = element; }} className={active === index ? "is-active" : ""}>
            <span>{item.step}</span><p>{item.label}</p><h3>{item.title}</h3><div>{item.text}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
