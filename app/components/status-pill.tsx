import type { EntitlementState } from "@/lib/entitlements";

const labels: Record<EntitlementState, string> = {
  active: "Acesso ativo",
  pending: "Pagamento pendente",
  overdue: "Pagamento em atraso",
  canceled: "Renovação cancelada",
  inactive: "Plano não ativado",
};

export function StatusPill({ state }: { state: EntitlementState }) {
  return <span className={`status-pill status-pill--${state}`}><span aria-hidden="true" />{labels[state]}</span>;
}
