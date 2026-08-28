# Evolução para assinaturas — plano, não funcionalidades entregues

Responsável pela idealização e pelos requisitos: Anny Gabrielly (@annygabb).
Data: 2026-08-28. Decisões comerciais, fiscais e visuais aguardam aprovação.

## Entregue nesta etapa

- Catálogo: Grainient e Typ.io substituem as duas referências antigas; Velvetyne, Nappy, Foodiesfeed, Life of Pix e Stocksy são acrescentados.
- Todos permanecem recursos externos de Personalização, não skills executáveis.
- Testes cobrem URLs, IDs, classificação, preservação da skill comunitária e exportação das referências sem ativá-las.
- Nenhum checkout, login ou bloqueio de assinatura foi ativado.

## Fases e critérios de saída

1. **Design e conteúdo**: aprovar público, tom, preço e chamada principal; desenvolver home, cadastro/login, perfil e estados de assinatura em preview. Revisar teclado, contraste, foco, formulários autoexpansíveis e telas 320/375/414/768/desktop. Estados demonstrativos devem ser identificados; nunca simular pagamento concluído real.
2. **Identidade e dados**: selecionar provedor gerenciado com login Google e autorização OAuth compatível com MCP. Criar usuários, vínculos de identidade, projetos, assinaturas, pagamentos, eventos e documentos fiscais em banco persistente. Testar isolamento entre usuários e sessões. Evitar implementar um servidor OAuth caseiro.
3. **Cobrança em sandbox**: checkout hospedado, mensalidade, perfil com valor, próxima cobrança, período pago e cancelamento. Webhooks autenticados, idempotentes e reconciliados com o provedor; testes de pagamento, falha, atraso, repetição, eventos fora de ordem e cancelamento. Sem armazenar cartão no app.
4. **Autorização do site e MCP**: aplicar uma única política de acesso no servidor em cada operação paga, inclusive tools/call, leitura de conteúdo protegido e APIs diretas. Testar sessão válida mas assinatura vencida e impedir acesso por IDs de outro usuário.
5. **Fiscal e produção**: confirmar enquadramento e serviço com contador; integrar NFS-e, falhas/reprocessamento e consulta/download autorizados. Revisar termos, privacidade, retenção, backup, monitoramento, recuperação e rollout. Só ativar cobrança real após homologação.

Cada fase deve ter PR pequeno, testes unitários e de integração pertinentes, build/typecheck, evidências de QA e aceite antes da seguinte. E2E do OAuth e checkout precisam de contas de teste e callbacks reais; mocks não comprovam integração ao vivo.

## Home: roteiro proposto para aprovação

| Pergunta | Conteúdo proposto |
| --- | --- |
| O que | Um painel para escolher skills e organizar referências de criação e revisão de sites com IA. |
| Por quê | Reduzir buscas dispersas e tornar explícito o que deve orientar cada projeto. |
| Quem | Idealização e requisitos por Anny Gabrielly, @annygabb; manter créditos e licenças dos autores das skills. |
| Onde | Online, pelo site e em clientes compatíveis com a integração MCP; celular e computador. |
| Quando ganha valor | Ao iniciar ou revisar um projeto: sair de links e instruções soltos para uma seleção revisada e confirmada. Não prometer resultado financeiro ou prazo garantido. |
| Recursos priorizados | Skills por objetivo; referências externas de tipografia, fundos, fotos e componentes. Custos/licenças de terceiros e planos das IAs não estão automaticamente incluídos. |
| Como | Entrar, escolher, conferir, confirmar e usar no projeto; nenhuma aplicação silenciosa. |
| Quanto | Preço mensal e condições ainda a definir. Não publicar preço inventado nem checkout funcional antes do aceite. |

Público sugerido, ainda não aprovado: profissionais/autônomos e pequenas equipes que criam sites com IA. Tom sugerido: direto, profissional, identidade azul atual. Ação principal sugerida: criar conta e conhecer o plano.

## Preservação do painel e integração

Hoje `/` é o seletor, e `/mcp` busca o HTML dessa rota. Ao criar a home, mover o seletor para `/painel` e atualizar a origem do recurso MCP na mesma mudança; não servir a home comercial dentro do seletor do chat. Preservar seleção, confirmação, busca, proposição via PR, atribuição e layout responsivo.

O login Google no site não autoriza automaticamente um cliente MCP. A integração precisa de discovery OAuth, authorization code com PKCE, callbacks permitidos e tokens com issuer, audience, expiração e escopos validados. Depois da identidade, consultar a assinatura no servidor; um JWT ainda válido não garante assinatura vigente. Testar cada cliente de IA separadamente, sem prometer suporte universal a cards.

## Regra de acesso proposta

- Home, entrar, recuperar acesso, pagar, consultar faturas/notas e cancelar continuam acessíveis mesmo sem assinatura ativa.
- Recursos pagos disponíveis apenas durante o período efetivamente pago, usando relógio do servidor. Sem tolerância adicional proposta; confirmar com Anny.
- Cancelamento interrompe renovação; proposta é preservar o período já pago. Reembolso/chargeback têm política própria a aprovar.
- Quando terminar o período pago sem renovação confirmada, negar novos usos do site e do MCP com motivo claro e caminho para regularizar. Não provocar erro genérico nem apagar projetos.
- Falha ou pendência de pagamento não pode conceder acesso só porque o navegador chegou à URL de sucesso.
- Não guardar decisão de assinatura em cache longo ou no cliente. Invalidar caches pertinentes e reconciliar eventos perdidos; checar `paid_until` em toda operação paga.
- Dados já copiados, mensagens anteriores e catálogo público no GitHub não podem ser revogados. Decidir se a assinatura remunera o serviço/organização ou conteúdo exclusivo. Conteúdo exclusivo não deve estar em JSON público, assets estáticos ou repositório público.

## Cobrança e fiscal: recomendação a validar

Avaliar Asaas para operação brasileira por reunir recorrência e NFS-e. Verificar conta, disponibilidade fiscal no município, tarifas, métodos recorrentes e condições antes de escolher. Não é uma integração contratada ou implementada.

Asaas documenta autenticação dos webhooks pelo header `asaas-access-token` e deduplicação por ID do evento. Usar segredo exclusivo (não a chave da API), HTTPS, persistência transacional e fila/reconciliação. Não supor assinatura HMAC que o provedor não fornece. Checkout hospedado e confirmação server-to-server são requisitos de projeto; validar as APIs específicas na fase de integração.

Pagamento, recibo/cobrança e NFS-e são documentos/eventos distintos. Serviço municipal, regime, tributos, competência, cancelamento fiscal e obrigação de emitir precisam ser validados pelo contador. Não presumir elegibilidade ao MEI nem enquadramento tributário de SaaS. No perfil, separar cobranças de notas fiscais e indicar emissão pendente/falha sem expor dados de outros clientes.

## Segurança e testes mínimos

- Segredos só no servidor; privilégios mínimos; sem tokens de acesso em URLs/logs. Cookies seguros e proteção contra CSRF; callbacks e redirecionamentos permitidos explicitamente.
- Isolamento de dados por usuário; consultar no servidor o vínculo entre usuário e customer/subscription. Não confiar em preço, plano, usuário ou estado enviados pelo cliente.
- Rate limit persistente, validação de entrada, proteção SSRF, revisão humana de novas skills e manutenção da proteção Turnstile.
- Testes unitários: política de acesso, limites exatos de tempo, valores monetários em centavos, validações e transições de estado.
- Integração: autenticação/escopos, isolamento de usuários, webhook falso/duplicado/fora de ordem, cancelamento idempotente e reconciliação.
- E2E: login Google, checkout sandbox, retorno, renovação, vencimento, regularização, cancelamento, perfil e cliente MCP real. Testar acesso direto à API após bloqueio.
- Fluxo fiscal: emissão pendente/autorizada/rejeitada/cancelada, retentativas limitadas e alerta sem duplicar nota.
- Acessibilidade/mobile, regressão de seleção e confirmação, build/typecheck, dependências, logs sem dados sensíveis e backup restaurável. Nenhum teste elimina todos os riscos.

## Decisões e acessos necessários

1. Público principal, tom visual e ação principal da home.
2. Valor mensal em BRL, um ou mais planos, período gratuito (se houver), cancelamento, reembolso e política de atraso.
3. Pessoa física ou empresa; se empresa, regime conhecido e cidade/UF. Não enviar CPF/CNPJ completo, chave privada ou certificado pelo chat.
4. Provedor de identidade/banco e provedor de pagamentos aprovados; contas sandbox e de produção com segredos configurados diretamente na hospedagem.
5. Projeto Google OAuth com domínio e callbacks corretos; configuração MCP por cliente; termos, contato de suporte e privacidade.
6. Regra de migração para usuários atuais e conta administrativa da Anny; não bloquear usuários existentes sem plano de lançamento.

## Fontes oficiais consultadas

- [OAuth para plugins MCP](https://developers.openai.com/plugins/build/auth)
- [Asaas: visão geral](https://docs.asaas.com/docs/visao-geral)
- [Asaas: notas automáticas em assinaturas](https://docs.asaas.com/docs/emitir-notas-fiscais-automaticamente-para-assinaturas)
- [Asaas: autenticação e idempotência dos webhooks](https://docs.asaas.com/docs/sobre-os-webhooks)
- [Portal nacional NFS-e](https://www.gov.br/nfse/pt-br)

Fontes consultadas em 2026-08-28. Revalidar antes da integração; preços não estimados neste documento.
