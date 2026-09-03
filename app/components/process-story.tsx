"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type PointerEvent } from "react";

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
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 120, damping: 18 });
  const smoothY = useSpring(pointerY, { stiffness: 120, damping: 18 });
  const rotateY = useTransform(smoothX, [-.5, .5], [-13, 13]);
  const rotateX = useTransform(smoothY, [-.5, .5], [11, -11]);

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

  useEffect(() => {
    if (reducedMotion) return;
    let disposed = false;
    let tween: { kill: () => void } | undefined;
    void import("gsap").then(({ gsap }) => {
      if (disposed) return;
      tween = gsap.fromTo(".process-map__plane", { opacity: .12 }, { opacity: .72, duration: .85, stagger: .08, ease: "power3.out" });
    });
    return () => { disposed = true; tween?.kill(); };
  }, [active, reducedMotion]);

  function moveMap(event: PointerEvent<HTMLDivElement>) {
    if (reducedMotion) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - .5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - .5);
  }

  const stage = stages[active];

  return (
    <section className="process-story" id="como-funciona" aria-labelledby="process-story-title">
      <div className="process-story__visual">
        <div className="process-sticky">
          <div className="process-map" role="img" aria-label={`Etapa ${stage.step}: ${stage.status}`} onPointerMove={moveMap} onPointerLeave={() => { pointerX.set(0); pointerY.set(0); }}>
            <div className="process-map__glow" aria-hidden="true" />
            <motion.div className="process-map__stage" style={reducedMotion ? undefined : { rotateX, rotateY }}>
              <div className="process-map__plane process-map__plane--back" aria-hidden="true" />
              <div className="process-map__plane process-map__plane--front" aria-hidden="true" />
              <svg viewBox="0 0 600 600" aria-hidden="true"><circle cx="300" cy="300" r="192"/><path d="M300 108V492M108 300H492M164 164L436 436M436 164L164 436"/></svg>
              <AnimatePresence mode="wait">
                <motion.div key={stage.step} className="process-core" initial={reducedMotion ? false : { opacity: 0, scale: .78, z: -60 }} animate={{ opacity: 1, scale: 1, z: 48 }} exit={reducedMotion ? undefined : { opacity: 0, scale: 1.12, z: 90 }} transition={{ duration: .5, ease: [.16, 1, .3, 1] }}>
                  <span>{stage.step}</span><strong>{stage.status}</strong><small>{stage.progress}% organizado</small>
                </motion.div>
              </AnimatePresence>
              {nodes.map((node, index) => <motion.span key={node} className={`process-node process-node--${index + 1}`} animate={{ opacity: index <= active ? 1 : .28, scale: index === active ? 1.12 : 1, z: index === active ? 78 : 24 }} transition={{ duration: .42 }}>{node}<i aria-hidden="true">{index <= active ? "✓" : "·"}</i></motion.span>)}
              <div className="process-progress" aria-hidden="true"><span style={{ transform: `scaleX(${stage.progress / 100})` }} /></div>
            </motion.div>
          </div>
          <p aria-live="polite"><span>{stage.label}</span><strong>{stage.status}</strong></p>
        </div>
      </div>
      <div className="process-story__steps">
        <header><p>Veja a direção ganhar forma</p><h2 id="process-story-title">Cada escolha acende uma nova camada do projeto.</h2><span>Role a página ou passe o cursor pelo mapa para acompanhar referências, design, segurança e prompt se conectando em uma única direção.</span></header>
        {stages.map((item, index) => (
          <article key={item.step} ref={(element) => { stageRefs.current[index] = element; }} className={active === index ? "is-active" : ""} aria-current={active === index ? "step" : undefined} tabIndex={0} onFocus={() => setActive(index)} onPointerEnter={() => setActive(index)}>
            <span>{item.step}</span><p>{item.label}</p><h3>{item.title}</h3><div>{item.text}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
