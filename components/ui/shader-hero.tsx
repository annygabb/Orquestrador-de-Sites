"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { MeshGradient } from "@paper-design/shaders-react";
import { Button } from "@/components/ui/button";

const paletteTokens = [
  ["--color-stage-void", "--color-stage-deep", "--color-stage-accent", "--color-stage-bright"],
  ["--color-stage-void", "--color-stage-panel", "--color-stage-mid", "--color-stage-soft"],
  ["--color-stage-night", "--color-stage-strong", "--color-stage-electric", "--color-stage-ice"],
] as const;

const modes = ["Direção", "Interface", "Entrega"] as const;

export function ShaderHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [mode, setMode] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [palettes, setPalettes] = useState<string[][]>([]);

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    setPalettes(paletteTokens.map((palette) => palette.map((token) => styles.getPropertyValue(token).trim())));
  }, []);

  function moveShader(event: PointerEvent<HTMLDivElement>) {
    if (reducedMotion) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.42,
      y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.34,
    });
  }

  return (
    <div ref={containerRef} className="shader-visual" onPointerMove={moveShader} onPointerLeave={() => setPointer({ x: 0, y: 0 })}>
      {palettes[mode] && <MeshGradient
        className="shader-visual__mesh"
        colors={palettes[mode]}
        speed={reducedMotion ? 0 : 0.22}
        distortion={0.72}
        swirl={0.48 + mode * 0.14}
        grainMixer={0.12}
        grainOverlay={0.06}
        scale={1.2}
        offsetX={pointer.x}
        offsetY={pointer.y}
        maxPixelCount={1920 * 1080}
        aria-hidden="true"
      />}
      <div className="shader-visual__grid" aria-hidden="true" />
      <motion.div
        className="shader-console"
        initial={reducedMotion ? false : { opacity: 0, y: 24, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: pointer.y * -12, rotateY: pointer.x * 18 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="shader-console__top"><span><Sparkles size={15} /> ORQUESTRAÇÃO ATIVA</span><b>03 camadas</b></div>
        <strong>Uma direção que evolui enquanto você decide.</strong>
        <div className="shader-console__flow">
          <span>Referências</span><ArrowRight aria-hidden="true" /><span>Critérios</span><ArrowRight aria-hidden="true" /><span>Prompt revisado</span>
        </div>
        <div className="shader-console__modes" aria-label="Alterar visualização do processo">
          {modes.map((label, index) => (
            <Button key={label} size="sm" variant={mode === index ? "default" : "outline"} aria-pressed={mode === index} onClick={() => setMode(index)}>
              {label}
            </Button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
