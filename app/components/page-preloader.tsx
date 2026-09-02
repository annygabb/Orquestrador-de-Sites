"use client";

import { useEffect, useState } from "react";

export function PagePreloader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setVisible(false), reduced ? 80 : 720);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="page-preloader" role="status" aria-label="Preparando a experiência">
      <div className="preloader-mark" aria-hidden="true"><span>O</span><span>S</span></div>
      <p>Organizando o próximo passo</p>
      <div className="preloader-line" aria-hidden="true"><span /></div>
    </div>
  );
}
