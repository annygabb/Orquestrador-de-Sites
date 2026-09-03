"use client";

import { useEffect, useState } from "react";
import { FloatingPaths } from "@/components/ui/auth-page";

const loadingSteps = ["Lendo o objetivo", "Conectando referências", "Organizando critérios", "Direção pronta"];

export function PagePreloader() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const timer = window.setTimeout(() => setVisible(false), 160);
      return () => window.clearTimeout(timer);
    }
    const intervals = loadingSteps.slice(1).map((_, index) => window.setTimeout(() => setStep(index + 1), 850 * (index + 1)));
    const exitTimer = window.setTimeout(() => setLeaving(true), 3600);
    const hideTimer = window.setTimeout(() => setVisible(false), 4400);
    return () => { intervals.forEach(window.clearTimeout); window.clearTimeout(exitTimer); window.clearTimeout(hideTimer); };
  }, []);

  if (!visible) return null;

  return (
    <div className={`page-preloader${leaving ? " is-leaving" : ""}`} role="status" aria-label="Preparando a experiência">
      <div className="preloader-panel preloader-panel--left" aria-hidden="true" />
      <div className="preloader-panel preloader-panel--right" aria-hidden="true" />
      <FloatingPaths position={1} className="preloader-paths" />
      <FloatingPaths position={-1} className="preloader-paths preloader-paths--reverse" />
      <header className="preloader-head"><strong><i aria-hidden="true">OS</i> ORQUESTRADOR</strong><span>0{step + 1} / 04</span></header>
      <div className="preloader-experience">
        <div className="preloader-orbit" aria-hidden="true"><span>REFERÊNCIAS</span><span>SKILLS</span><span>CRITÉRIOS</span></div>
        <p>DE REFERÊNCIAS SOLTAS</p>
        <h2>A uma direção<br/><span>pronta para a IA.</span></h2>
      </div>
      <div className="preloader-content">
        <p key={loadingSteps[step]}>{loadingSteps[step]}</p>
        <div className="preloader-line" aria-hidden="true"><span /></div>
      </div>
    </div>
  );
}
