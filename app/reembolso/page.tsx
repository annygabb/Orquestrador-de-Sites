import { LegalPage } from "@/app/components/legal-page";

export const metadata = { title: "Política de reembolso" };

export default function RefundPage() {
  return <LegalPage title="Política de reembolso" summary="Como cancelamentos, desistência e análise de reembolso serão tratados."><h2>Cancelamento</h2><p>A renovação pode ser cancelada no perfil. O acesso continua até o fim do período já pago e não há nova cobrança recorrente após o cancelamento ser processado.</p><h2>Direito de arrependimento</h2><p>Pedidos feitos no prazo legal aplicável à contratação online serão analisados conforme o Código de Defesa do Consumidor. Antes do lançamento, o canal de solicitação e o prazo interno de resposta devem ser publicados.</p><h2>Cobranças duplicadas ou indevidas</h2><p>O titular deve informar a cobrança pelo suporte. A análise considera os registros do Asaas e a trilha de auditoria, sem solicitar senha, token ou código 2FA.</p><h2>Estornos e acesso</h2><p>Um estorno confirmado encerra o período correspondente e pode suspender o acesso. Chargebacks fraudulentos podem resultar em bloqueio preventivo para investigação.</p></LegalPage>;
}
