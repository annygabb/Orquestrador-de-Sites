"use client";

import { useMemo, useState, type CSSProperties } from "react";

export function TimeEstimator() {
  const [projects, setProjects] = useState(4);
  const [currentHours, setCurrentHours] = useState(5);
  const [organizedHours, setOrganizedHours] = useState(2);
  const regained = useMemo(() => Math.max(0, projects * (currentHours - organizedHours)), [projects, currentHours, organizedHours]);
  const maxBar = Math.max(currentHours, organizedHours, 1);

  return (
    <div className="time-estimator">
      <header><div><span>Simulação ajustável</span><strong>Use a sua rotina, não uma promessa pronta.</strong></div><output aria-live="polite"><b>{regained.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}h</b><span>potencialmente recuperadas por mês</span></output></header>
      <div className="estimator-controls">
        <label><span>Projetos por mês <b>{projects}</b></span><input type="range" min="1" max="12" value={projects} onChange={(event) => setProjects(Number(event.target.value))} /></label>
        <label><span>Busca e organização hoje <b>{currentHours}h/projeto</b></span><input type="range" min="0.5" max="12" step="0.5" value={currentHours} onChange={(event) => setCurrentHours(Number(event.target.value))} /></label>
        <label><span>Com um processo organizado <b>{organizedHours}h/projeto</b></span><input type="range" min="0.5" max="12" step="0.5" value={organizedHours} onChange={(event) => setOrganizedHours(Number(event.target.value))} /></label>
      </div>
      <div className="estimator-chart" aria-label={`Comparação: ${currentHours} horas hoje e ${organizedHours} horas com processo organizado por projeto`}>
        <div><span>Hoje</span><div><i style={{ "--bar-scale": currentHours / maxBar } as CSSProperties} /></div><strong>{currentHours}h</strong></div>
        <div><span>Organizado</span><div><i style={{ "--bar-scale": organizedHours / maxBar } as CSSProperties} /></div><strong>{organizedHours}h</strong></div>
      </div>
      <p>Resultado ilustrativo calculado apenas com os valores que você escolher. O ganho real depende do projeto e do seu fluxo.</p>
    </div>
  );
}
