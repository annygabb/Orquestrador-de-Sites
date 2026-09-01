"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(window.localStorage.getItem("os-cookie-choice") === null); }, []);
  if (!visible) return null;
  function choose(value: "necessary" | "preferences") {
    window.localStorage.setItem("os-cookie-choice", value);
    setVisible(false);
  }
  return <aside className="cookie-banner" aria-label="Preferências de cookies"><div><strong>Privacidade sem surpresa</strong><p>Usamos cookies essenciais de sessão e segurança. Preferências opcionais ficam bloqueadas até sua escolha.</p><Link href="/cookies">Ver política de cookies</Link></div><div><button className="button button--outline" onClick={() => choose("necessary")}>Somente necessários</button><button className="button button--primary" onClick={() => choose("preferences")}>Aceitar preferências</button></div></aside>;
}
