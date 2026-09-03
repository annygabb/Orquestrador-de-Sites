"use client";

import { useState } from "react";
import { csrfHeaders } from "@/lib/client-security";

export function TokenManager({ enabled }: { enabled: boolean }) {
  const [token, setToken] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  async function generate() {
    setState("loading"); setToken("");
    const response = await fetch("/api/account/token", { method: "POST", headers: await csrfHeaders() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setState("error"); return; }
    setToken(data.token); setState("idle");
  }
  async function copy() { await navigator.clipboard.writeText(token); }
  return <div className="token-manager"><p>Crie uma chave pessoal com validade de 30 dias para clientes MCP que aceitam <code>Authorization: Bearer</code>. Uma nova chave revoga a anterior.</p><button className="button button--outline" disabled={!enabled || state === "loading"} onClick={generate}>{state === "loading" ? "Gerando…" : "Gerar nova chave"}</button>{token && <div className="token-once"><strong>Copie agora. Ela não será exibida novamente.</strong><code>{token}</code><button className="button button--quiet" onClick={copy}>Copiar chave</button></div>}{state === "error" && <p role="alert">Não foi possível gerar a chave.</p>}</div>;
}
