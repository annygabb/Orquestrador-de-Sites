"use client";

import { useState } from "react";
import { csrfHeaders } from "@/lib/client-security";

export function SubscriptionActions({ canCancel }: { canCancel: boolean }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  async function cancel() {
    if (!window.confirm("Cancelar a renovação? O acesso continua até o fim do período já pago.")) return;
    setState("loading");
    const response = await fetch("/api/billing/cancel", { method: "POST", headers: await csrfHeaders() });
    setState(response.ok ? "done" : "error");
    if (response.ok) window.location.reload();
  }
  return <div className="subscription-actions"><button className="button button--outline" type="button" disabled={!canCancel || state === "loading"} onClick={cancel}>{state === "loading" ? "Cancelando…" : "Cancelar renovação"}</button>{state === "error" && <p role="alert">Não foi possível cancelar agora. Tente novamente ou fale com o suporte.</p>}{state === "done" && <p role="status">Renovação cancelada.</p>}</div>;
}
