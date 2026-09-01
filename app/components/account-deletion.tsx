"use client";

import { useState } from "react";
import { csrfHeaders } from "@/lib/client-security";

export function AccountDeletion() {
  const [confirmation, setConfirmation] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  async function remove() {
    setState("loading");
    const response = await fetch("/api/account/delete", { method: "POST", headers: { "Content-Type": "application/json", ...await csrfHeaders() }, body: JSON.stringify({ confirmation }) });
    if (!response.ok) return setState("error");
    window.location.assign("/?conta=excluida");
  }
  return <div className="danger-zone"><p>Exclui a conta e os dados ativos. Registros anonimizados de obrigação legal e backups criptografados expiram conforme a política.</p><label><span>Digite EXCLUIR</span><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" /></label><button type="button" className="button button--danger" disabled={confirmation !== "EXCLUIR" || state === "loading"} onClick={remove}>{state === "loading" ? "Excluindo…" : "Excluir conta e dados"}</button>{state === "error" && <p role="alert">A exclusão não foi concluída. Tente novamente ou contate o suporte.</p>}</div>;
}
