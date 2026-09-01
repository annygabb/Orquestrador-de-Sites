# Orquestrador de Sites

SaaS de Anny Gabrielly para escolher, combinar e aplicar skills e referências em projetos de sites com IA. O produto reúne uma home comercial, login Google, cobrança recorrente, painel responsivo, perfil de assinatura, proposta de novas skills por Pull Request e servidor MCP com acesso pago.

## Modelo comercial do MVP

- primeira cobrança: **R$ 59,90**, com 30 dias de acesso;
- depois: **R$ 29,90 por mês**;
- cancelamento interrompe as próximas cobranças e preserva o período já pago;
- atraso após o fim do período pago, reembolso ou chargeback bloqueiam painel, APIs pagas e MCP;
- o MVP não emite nota fiscal automaticamente e não guarda cartão nem CPF no banco local. O CPF é enviado diretamente ao Asaas para criar o cliente.

Os valores são definidos no servidor em centavos. O navegador nunca escolhe preço, usuário ou estado da assinatura.

## O que foi implementado

- home direta, modo claro/escuro e layout responsivo;
- login Google com Supabase Auth;
- PostgreSQL/Supabase com migração, índices e Row Level Security;
- checkout hospedado do Asaas, webhook autenticado e idempotente;
- ativação de 30 dias e criação da recorrência mensal após o primeiro pagamento confirmado;
- perfil com situação, valor, vencimento, cancelamento e chave pessoal do MCP;
- seis eventos de e-mail: cadastro, ativação paga, lembrete D-3, pagamento confirmado, acesso suspenso e cancelamento;
- seletor de 44 skills/recursos, incluindo Revenue-Centric Design;
- proposta de skill via GitHub App, protegida por assinatura e Cloudflare Turnstile;
- bloqueio do painel, das propostas e das operações MCP sem período pago;
- testes unitários de seleção, Turnstile, cobrança e autorização temporal.

## Arquitetura

| Área | Serviço | Papel |
| --- | --- | --- |
| Frontend e backend | Next.js 16 na Vercel | Home, painel, APIs, cron e MCP |
| Identidade e dados | Supabase | Google OAuth, PostgreSQL e RLS |
| Pagamentos | Asaas | Cobrança hospedada, recorrência e webhooks |
| E-mails | Resend | Mensagens transacionais |
| Antispam | Cloudflare Turnstile | Proteção de propostas |
| Aprovação | GitHub App | Branch e Pull Request por proposta |

## Configuração

Copie `.env.example` para seu ambiente local e registre os mesmos nomes na Vercel. Nunca envie chaves privadas ao GitHub.

### 1. Supabase e Google

1. Crie um projeto no Supabase.
2. Execute `supabase/migrations/202608290001_saas_mvp.sql` no SQL Editor.
3. Em Authentication, habilite Google e configure o Client ID e Client Secret do Google Cloud.
4. No Google Cloud, autorize o callback exibido pelo Supabase, normalmente `https://SEU-PROJETO.supabase.co/auth/v1/callback`.
5. No Supabase, registre a URL de produção e os previews permitidos.
6. Defina `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` somente no servidor.
7. Depois do primeiro login da administradora, marque manualmente `profiles.is_admin = true` apenas nessa conta.

O painel público não recebe a service role. As políticas RLS limitam cada usuário às próprias linhas.

### 2. Asaas

Comece no sandbox. Defina `ASAAS_API_URL=https://api-sandbox.asaas.com/v3`, `ASAAS_API_KEY` e um `ASAAS_WEBHOOK_TOKEN` aleatório e exclusivo.

Cadastre o webhook `https://SEU-DOMINIO/api/webhooks/asaas`, usando o mesmo token, para pelo menos:

- `PAYMENT_CONFIRMED`;
- `PAYMENT_RECEIVED`;
- `PAYMENT_OVERDUE`;
- `PAYMENT_REFUNDED`;
- `PAYMENT_CHARGEBACK_REQUESTED`;
- `PAYMENT_CHARGEBACK_DISPUTE`.

O webhook busca novamente a cobrança no Asaas, ignora eventos repetidos e evita que um evento vencido antigo derrube um período mais recente. Só troque para a API de produção depois de testar pagamento, repetição, atraso, cancelamento, reembolso e evento fora de ordem.

### 3. Resend e cron

Verifique um domínio no Resend e defina `RESEND_API_KEY` e `EMAIL_FROM`. Crie também `CRON_SECRET`; a Vercel executará diariamente `/api/cron/subscriptions` para lembretes e expiração. Sem Resend configurado, a cobrança continua funcionando, mas os e-mails ficam registrados como não enviados.

### 4. Turnstile e GitHub App

No Turnstile, autorize `orquestradordesites.vercel.app` e defina:

```text
TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
TURNSTILE_EXPECTED_HOSTNAME=orquestradordesites.vercel.app
APP_ORIGIN=https://orquestradordesites.vercel.app
BASE_URL=https://orquestradordesites.vercel.app
```

Na GitHub App, mantenha `Contents: Read and write`, `Pull requests: Read and write` e `Metadata: Read-only`; aceite as permissões atualizadas e instale a App somente neste repositório. Defina as variáveis `GITHUB_*` descritas em `.env.example`.

## Acesso pelo ChatGPT e outras IAs

O endpoint é `https://SEU-DOMINIO/mcp`. O perfil gera uma chave `os_...`, mostrada uma única vez; clientes MCP que aceitam cabeçalho personalizado devem enviar `Authorization: Bearer os_...`. Revogar/gerar outra chave invalida a anterior.

Este MVP implementa token pessoal, não um servidor OAuth 2.1 completo. Alguns clientes, inclusive versões do ChatGPT que exigem discovery OAuth para conectores remotos, podem não aceitar cabeçalho Bearer manual. Nesse caso, a próxima fase é OAuth 2.1 com Authorization Code + PKCE; não reduza a segurança colocando a chave na URL.

## Desenvolvimento e validação

```bash
npm install
npm run dev
npm run typecheck
npm run validate:skills
npm test
npm run build
```

Os testes usam mocks e funções puras; eles não comprovam Google OAuth, entrega real de e-mail nem pagamento real. Antes de abrir cobrança em produção, conclua os testes de integração no sandbox e uma revisão jurídica/contábil básica para operação como pessoa física.

## Operação segura

- mantenha segredos somente na Vercel e faça rotação após qualquer exposição;
- use ambientes separados para sandbox e produção;
- acompanhe `billing_events` com status `failed` e reprocese de forma controlada;
- habilite MFA nas contas Vercel, Supabase, Asaas, Google, Resend e GitHub;
- exporte backups do banco enquanto estiver no plano gratuito e faça um teste de restauração;
- não prometa disponibilidade, compatibilidade universal ou resultado financeiro;
- publique termos, privacidade, política de reembolso e um canal de suporte antes da venda real.

## Autoria e referências

Idealização, requisitos e direção do produto: **Anny Gabrielly · [@annygabb](https://github.com/annygabb)**. Recursos externos do catálogo continuam identificados como referências, não como skills instaladas. Cada fonte mantém seus próprios termos e licenças.
