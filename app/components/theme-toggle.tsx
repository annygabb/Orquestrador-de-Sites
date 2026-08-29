"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = window.localStorage.getItem("os-theme") as Theme | null;
    const next = saved ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = next;
    setTheme(next);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("os-theme", next);
    setTheme(next);
  }

  return (
    <button className={compact ? "theme-toggle theme-toggle--compact" : "theme-toggle"} type="button" onClick={toggle} aria-label={`Ativar modo ${theme === "dark" ? "claro" : "escuro"}`} aria-pressed={theme === "dark"}>
      <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
      {!compact && <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>}
    </button>
  );
}
