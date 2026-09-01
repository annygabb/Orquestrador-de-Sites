"use client";

import { useEffect, useState } from "react";
import { csrfHeaders } from "@/lib/client-security";

type Factor = { id: string; status: string; friendlyName?: string };

export function MfaManager() {
  const [factor, setFactor] = useState<Factor | null>(null);
  const [enrollment, setEnrollment] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [state, setState] = useState<"loading" | "idle" | "error">("loading");
  async function load() {
    const response = await fetch("/api/security/mfa", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    setFactor(data.factors?.find((item: Factor) => item.status === "verified") ?? null);
    setState(response.ok ? "idle" : "error");
  }
  useEffect(() => { void load(); }, []);
  async function mutate(body: object) {
    setState("loading");
    const response = await fetch("/api/security/mfa", { method: "POST", headers: { "Content-Type": "application/json", ...await csrfHeaders() }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setState("error"); return null; }
    setState("idle");
    return data;
  }
  async function enroll() { const data = await mutate({ action: "enroll" }); if (data) setEnrollment(data); }
  async function verify() { if (!enrollment) return; const data = await mutate({ action: "verify", factorId: enrollment.factorId, code }); if (data) { setEnrollment(null); setCode(""); await load(); } }
  async function unenroll() { if (!factor || !window.confirm("Desativar a autenticação em dois fatores?")) return; const data = await mutate({ action: "unenroll", factorId: factor.id }); if (data) await load(); }
  return <div className="mfa-manager"><p>{factor ? "A autenticação em dois fatores está ativa nesta conta." : "Adicione um aplicativo autenticador para proteger ações sensíveis."}</p>{!factor && !enrollment && <button type="button" className="button button--outline" disabled={state === "loading"} onClick={enroll}>Ativar 2FA</button>}{enrollment && <div className="mfa-enrollment"><img src={enrollment.qrCode} width="192" height="192" alt="QR Code para configurar o aplicativo autenticador" /><p>Escaneie o QR Code ou use a chave <code>{enrollment.secret}</code>.</p><label><span>Código de 6 dígitos</span><input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} /></label><button type="button" className="button button--primary" disabled={code.length !== 6 || state === "loading"} onClick={verify}>Confirmar 2FA</button></div>}{factor && <button type="button" className="button button--outline" disabled={state === "loading"} onClick={unenroll}>Desativar 2FA</button>}{state === "error" && <p role="alert">Não foi possível atualizar o 2FA.</p>}</div>;
}
