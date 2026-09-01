# Segurança e operação

## Controles implementados no código

- Supabase somente no servidor; nenhuma sessão ou chave administrativa no bundle do navegador.
- UUID em usuários e entidades, RLS em todas as tabelas expostas e grants mínimos.
- Query builder parametrizado do Supabase; não há concatenação de SQL com entrada do usuário.
- React faz escaping contextual das strings. A única injeção HTML é o script constante de tema, protegido por nonce CSP.
- CSRF com token aleatório, cookie HttpOnly SameSite Strict, cabeçalho e validação de Origin.
- Cookies de autenticação HttpOnly, Secure em produção, SameSite Lax e sem tokens em localStorage ou sessionStorage.
- Rate limit persistente e atômico no Postgres por hash de usuário e IP.
- Tokens MCP aleatórios, armazenados apenas como SHA-256, revogáveis e com expiração de 30 dias.
- MFA TOTP via Supabase para ações sensíveis quando um fator está cadastrado.
- CSP com nonce, HSTS, nosniff, Permissions Policy, COOP e CORP.
- Exclusão pelo próprio usuário, tombstone anonimizado e janela de expurgo de backup.
- Logs estruturados com request ID e IP em hash; CPF, tokens, senhas e códigos MFA não entram nos logs.

`X-Frame-Options` não é enviado porque o painel precisa ser incorporado pelo ChatGPT. `frame-ancestors` na CSP define a allowlist moderna e restrita. Isso deve ser revalidado se os hosts oficiais do ChatGPT mudarem.

## Controles externos obrigatórios antes de produção

1. Aplicar a migração Supabase e testar as policies RLS com dois usuários distintos.
2. Configurar expiração JWT curta, rotação de refresh token, limite de inatividade e rate limits de Auth no painel Supabase.
3. Exigir MFA para a conta administradora e para operações internas críticas.
4. Ativar Vercel Firewall/WAF, proteção DDoS gerenciada e bloquear países apenas se houver motivo de negócio.
5. Configurar SPF, DKIM e DMARC no domínio usado pelo Resend. Iniciar DMARC em monitoramento e endurecer após observar relatórios.
6. Separar Development, Preview e Production, cada um com banco, chaves e webhooks próprios.
7. Configurar Sentry ou equivalente sem PII e alertas para taxa de erro, webhook, health check e aumento de 401, 403 e 429.
8. Guardar segredos somente na Vercel, Supabase, GitHub Actions ou cofre dedicado. Nunca copiar `.env` para o repositório.

## Backup e recuperação

O workflow diário exporta o Postgres, cifra antes do upload com age e envia para um bucket S3/R2 separado. Configure os secrets `BACKUP_DATABASE_URL`, `BACKUP_AGE_RECIPIENT`, `BACKUP_BUCKET`, `BACKUP_ENDPOINT`, `BACKUP_AWS_ACCESS_KEY_ID`, `BACKUP_AWS_SECRET_ACCESS_KEY` e `BACKUP_AWS_REGION`.

A chave privada age deve ficar fora do GitHub e do servidor de produção. Configure retenção de 30 dias no bucket, versionamento, Object Lock quando disponível e teste a restauração mensalmente em um banco isolado. Antes de restaurar, reaplique `privacy_deletions` para não reintroduzir dados que o titular mandou apagar.

## Pentest autorizado

Teste somente ambientes próprios e com dados sintéticos. Cobertura mínima: autenticação, CSRF, XSS, SQL injection, IDOR/BOLA, RLS entre dois usuários, rate limit, expiração de token, replay de webhook, prompt injection em propostas e vazamento em logs. Use OWASP ZAP em baseline passivo no Preview e testes ativos somente em staging isolado.

Prompts enviados a LLMs externos nunca devem conter `.env`, dumps, tokens, código proprietário não autorizado ou dados pessoais. Trate a resposta do modelo como entrada não confiável e confirme cada achado no código ou em teste reproduzível.

## Limites atuais

- O código não cria regras de WAF, DNS, SPF, DKIM, DMARC nem política de bucket sozinho; são controles do provedor.
- O backup automatizado só começa após os secrets e o bucket serem configurados.
- A minuta legal precisa de revisão profissional antes da venda.
- MFA é opcional por usuário no MVP. Para obrigatoriedade global, configure a política no Supabase e adicione recuperação segura de conta.
