# Estado do MVP e próximos passos

Atualizado em 2026-08-29. Responsável pela idealização e requisitos: Anny Gabrielly (@annygabb).

## Entregue no código

| Frente | Estado | Evidência |
| --- | --- | --- |
| Home e tema | Pronto | Home direta, claro/escuro e navegação responsiva |
| Login | Pronto para configurar | Supabase SSR, Google OAuth e callback seguro |
| Banco | Pronto para aplicar | Migração PostgreSQL com RLS, índices e auditoria de eventos |
| Cobrança | Pronto para sandbox | R$ 59,90 + 30 dias; recorrência posterior de R$ 29,90 |
| E-mails | Pronto para configurar | Seis eventos com deduplicação via Resend |
| Perfil | Pronto | Situação, vencimento, valor, cancelamento e chave MCP |
| Controle de acesso | Pronto | Painel, API de proposta e MCP consultam assinatura no servidor |
| Catálogo | Pronto | 44 opções; externos aparecem como referências, não skills |
| Testes locais | Pronto | Typecheck, catálogo, unitários e build |

## Ainda depende de contas externas

1. Criar o projeto Supabase, aplicar a migração e configurar Google OAuth.
2. Configurar Asaas sandbox e webhook; executar a matriz real de pagamentos.
3. Verificar domínio no Resend e validar entrega, rejeição e descadastro operacional.
4. Configurar as variáveis na Vercel e promover o Preview aprovado.
5. Publicar termos, privacidade, suporte e política de reembolso antes da primeira venda.
6. Definir estratégia de backup fora do Supabase Free e testar restauração.

## Limite conhecido do MCP

O MVP usa uma chave pessoal Bearer gerada no perfil. Isso bloqueia imediatamente novas chamadas quando a assinatura vence. Clientes que não permitem cabeçalho Bearer manual precisarão de uma segunda etapa com OAuth 2.1, discovery e PKCE. O login Google do site, sozinho, não autoriza um cliente MCP.

## Testes obrigatórios antes da produção

- login Google, logout e callback inválido;
- isolamento de duas contas no banco;
- primeira cobrança, confirmação, renovação e duplicação de eventos;
- evento vencido antigo depois de pagamento novo;
- atraso após `paid_until`, reembolso, chargeback e regularização;
- cancelamento repetido, preservando o período pago;
- falha temporária do Asaas e reprocessamento de `billing_events`;
- entrega e deduplicação dos seis e-mails;
- acesso ao painel, API e MCP antes/depois do vencimento;
- teclado, contraste e telas 320, 375, 414, 768 e desktop;
- restauração de um backup em ambiente separado.

## Próximas fases recomendadas

1. Homologação externa em sandbox e E2E.
2. OAuth 2.1 para conexão remota no ChatGPT e outros clientes estritos.
3. Termos, privacidade, reembolso, suporte e observabilidade.
4. Backups automatizados externos quando houver clientes pagantes.
5. Só então ativar chaves reais e aceitar pagamentos.

O MVP não inclui emissão automática de nota fiscal. Como a operação inicial será por CPF em Silvânia, Goiás, a obrigação tributária e a forma correta de documento devem ser confirmadas com apoio contábil antes de vender.
