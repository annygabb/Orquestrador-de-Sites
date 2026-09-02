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
      <div className="preloader-orbit" aria-hidden="true"><i /><i /><i /><div className="preloader-mark"><span>O</span><span>S</span></div></div>
      <p>Reunindo skills, critérios e direção</p>
      <div className="preloader-line" aria-hidden="true"><span /></div>
    </div>
  );
}
