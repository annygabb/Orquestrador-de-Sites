"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";

const OrchestrationScene = dynamic(
  () => import("@/app/components/orchestration-scene").then((module) => module.OrchestrationScene),
  { ssr: false, loading: () => <div className="orchestration-poster" aria-hidden="true"><span /><i /><b /></div> },
);

const signals = [
  { label: "Referências", value: "Fontes e repertório", className: "scene-signal--violet" },
  { label: "Skills", value: "Ações executáveis", className: "scene-signal--cyan" },
  { label: "Critérios", value: "Qualidade e limites", className: "scene-signal--lime" },
];

export function OrchestrationOrbit() {
  const reducedMotion = useReducedMotion();

  return (
    <figure className="orchestration-visual" aria-labelledby="orchestration-caption">
      <div className="orchestration-canvas" role="img" aria-label="Núcleo tridimensional que organiza referências, skills e critérios em uma instrução clara">
        <OrchestrationScene reducedMotion={Boolean(reducedMotion)} />
        <div className="scene-grid" aria-hidden="true" />
        {signals.map((signal, index) => (
          <motion.div
            className={`scene-signal ${signal.className}`}
            key={signal.label}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.38, delay: 0.28 + index * 0.09, ease: [0.16, 1, 0.3, 1] }}
            whileHover={reducedMotion ? undefined : { y: -3 }}
          >
            <span>{signal.label}</span>
            <strong>{signal.value}</strong>
          </motion.div>
        ))}
        <div className="scene-output"><span>Saída revisada</span><strong>Prompt pronto para executar</strong></div>
      </div>
      <figcaption id="orchestration-caption"><span>Arraste para explorar o núcleo</span><strong>Você mantém a decisão final.</strong></figcaption>
    </figure>
  );
}
