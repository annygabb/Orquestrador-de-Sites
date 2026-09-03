"use client";

import { useEffect, useState } from "react";
import GlobeStudy from "@/components/ui/globe-study";

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
      <header className="preloader-head"><strong>ORQUESTRADOR</strong><span>PREPARANDO DIREÇÃO</span></header>
      <GlobeStudy className="preloader-world" label="Globo de skills e referências em movimento" />
      <div className="preloader-content">
        <div className="preloader-count" aria-hidden="true">0{step + 1}</div>
        <p key={loadingSteps[step]}>{loadingSteps[step]}</p>
        <div className="preloader-line" aria-hidden="true"><span /></div>
      </div>
    </div>
  );
}
