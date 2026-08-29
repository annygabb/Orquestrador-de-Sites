import { ACTIVATION_PRICE_CENTS, RENEWAL_PRICE_CENTS, addDays, isoDate } from "./billing";

type AsaasCustomer = { id: string };
type AsaasPayment = { id: string; invoiceUrl?: string; status?: string };
type AsaasSubscription = { id: string };

function apiBase() {
  return (process.env.ASAAS_API_URL || "https://api-sandbox.asaas.com/v3").replace(/\/$/, "");
}

async function asaasRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY não configurada.");
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", access_token: apiKey, "User-Agent": "OrquestradorDeSites/1.0", ...init.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(body?.errors) ? body.errors.map((item: { description?: string }) => item.description).filter(Boolean).join(" ") : "";
    throw new Error(message || `Asaas recusou a operação (${response.status}).`);
  }
  return body as T;
}

export async function createAsaasCustomer(input: { userId: string; name: string; email: string; cpfCnpj: string }) {
  return asaasRequest<AsaasCustomer>("/customers", { method: "POST", body: JSON.stringify({ name: input.name, email: input.email, cpfCnpj: input.cpfCnpj.replace(/\D/g, ""), externalReference: input.userId, notificationDisabled: true }) });
}

export async function createActivationPayment(input: { userId: string; customerId: string }) {
  return asaasRequest<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: input.customerId,
      billingType: "UNDEFINED",
      value: ACTIVATION_PRICE_CENTS / 100,
      dueDate: isoDate(addDays(new Date(), 3)),
      description: "Ativação do Orquestrador de Sites — inclui 30 dias de acesso",
      externalReference: `activation:${input.userId}`,
    }),
  });
}

export async function createRenewalSubscription(input: { userId: string; customerId: string; nextDueDate: Date }) {
  return asaasRequest<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: input.customerId,
      billingType: "UNDEFINED",
      value: RENEWAL_PRICE_CENTS / 100,
      nextDueDate: isoDate(input.nextDueDate),
      cycle: "MONTHLY",
      description: "Renovação mensal do Orquestrador de Sites",
      externalReference: `renewal:${input.userId}`,
    }),
  });
}

export async function cancelAsaasSubscription(subscriptionId: string) {
  await asaasRequest(`/subscriptions/${encodeURIComponent(subscriptionId)}`, { method: "DELETE" });
}

export async function getAsaasPayment(paymentId: string) {
  return asaasRequest<AsaasPayment & { customer: string; subscription?: string; externalReference?: string; value?: number; dueDate?: string; paymentDate?: string }>(`/payments/${encodeURIComponent(paymentId)}`);
}
