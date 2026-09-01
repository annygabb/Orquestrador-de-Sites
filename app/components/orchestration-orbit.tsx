"use client";

import type { PointerEvent } from "react";

export function OrchestrationOrbit() {
  function tilt(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty("--orbit-rotate-x", `${-y * 10}deg`);
    event.currentTarget.style.setProperty("--orbit-rotate-y", `${x * 12}deg`);
  }

  function reset(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty("--orbit-rotate-x", "0deg");
    event.currentTarget.style.setProperty("--orbit-rotate-y", "0deg");
  }

  return (
    <div className="orbit-stage" role="img" tabIndex={0} onPointerMove={tilt} onPointerLeave={reset} aria-label="Fluxo tridimensional: referências entram, são organizadas e viram instruções prontas">
      <div className="orbit-engine">
        <div className="orbit-ring orbit-ring--outer" aria-hidden="true" />
        <div className="orbit-ring orbit-ring--inner" aria-hidden="true" />
        <div className="orbit-core"><span>OS</span><strong>Orquestrar</strong><small>antes de executar</small></div>
        <div className="orbit-node orbit-node--one"><span>Entrada</span><strong>Objetivo</strong></div>
        <div className="orbit-node orbit-node--two"><span>Critério</span><strong>Skills</strong></div>
        <div className="orbit-node orbit-node--three"><span>Saída</span><strong>Prompt claro</strong></div>
        <div className="orbit-path orbit-path--one" aria-hidden="true" />
        <div className="orbit-path orbit-path--two" aria-hidden="true" />
      </div>
      <div className="orbit-caption"><span>mova o cursor</span><strong>um processo, não uma lista</strong></div>
    </div>
  );
}
