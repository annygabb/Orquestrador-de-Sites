"use client";

import { useEffect, useState } from "react";
import { DotGlobeHero } from "@/components/ui/globe-hero";

export function PagePreloader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setVisible(false), reduced ? 80 : 820);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="page-preloader" role="status" aria-label="Preparando a experiência">
      <DotGlobeHero rotationSpeed={0.0035} globeRadius={1.05} className="preloader-world">
        <div className="preloader-content">
          <div className="preloader-mark" aria-hidden="true"><span>O</span><span>S</span></div>
          <p>Conectando skills, critérios e direção</p>
          <div className="preloader-line" aria-hidden="true"><span /></div>
        </div>
      </DotGlobeHero>
    </div>
  );
}
