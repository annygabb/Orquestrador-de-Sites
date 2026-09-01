"use client";

import { FormEvent, useState } from "react";
import { csrfHeaders } from "@/lib/client-security";
import { isValidCpf } from "@/lib/cpf";

export function BillingForm({ defaultName = "" }: { defaultName?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    if (!isValidCpf(String(form.get("cpf") ?? ""))) {
      setError("Informe um CPF válido.");
      setLoading(false);
      return;
    }
    const csrf = await csrfHeaders();
    const response = await fetch("/api/billing/start", { method: "POST", headers: { "Content-Type": "application/json", ...csrf }, body: JSON.stringify({ name: form.get("name"), cpf: form.get("cpf") }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.invoiceUrl) {
      setError(data.message || "A cobrança não pôde ser criada. Revise os dados e tente novamente.");
      setLoading(false);
      return;
    }
    window.location.assign(data.invoiceUrl);
  }

  return <form className="billing-form" onSubmit={submit}><label><span>Nome completo</span><input name="name" defaultValue={defaultName} minLength={3} maxLength={120} required autoComplete="name" /></label><label><span>CPF</span><input name="cpf" inputMode="numeric" minLength={11} maxLength={14} required autoComplete="off" placeholder="000.000.000-00" aria-describedby="cpf-help" /><small id="cpf-help">Enviado somente ao Asaas para criar a cobrança. Não aparece no navegador depois do envio.</small></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button--primary button--large" type="submit" disabled={loading}>{loading ? "Criando cobrança…" : "Ir para o pagamento seguro"}</button></form>;
}
