# Orquestrador de Sites

MCP App com uma interface completa de seleção: checkboxes, busca, filtros, contador e botão **Confirmar seleção**. A confirmação devolve ao ChatGPT as instruções das skills e personalizações escolhidas, que passam a valer no projeto a partir daquele momento.

## O que está incluído

- endpoint Streamable HTTP em `/mcp`;
- interface incorporada ao ChatGPT por MCP Apps;
- catálogo central versionado em `data/skills.json`;
- formulário público para propor novas skills por Pull Request;
- criação automática de `skills/<nome>/SKILL.md` em branch separada;
- proteção por Turnstile, origem, limite de envios, validação de links, duplicatas e instruções perigosas;
- fluxo em três etapas: selecionar, informar destino e enviar;
- ferramentas `open_skill_selector` e `confirm_skill_selection`;
- catálogo de design, UX, revisão de código, segurança, SEO, animação, otimização de tokens, componentes e referências;
- implantação pronta para Vercel;
- skill de orquestração para empacotamento como plugin Codex.

## Publicar na Vercel

1. Entre em [vercel.com/new](https://vercel.com/new) usando sua conta GitHub.
2. Importe o repositório `annygabb/Orquestrador-de-Sites`.
3. Mantenha o framework detectado como **Next.js** e faça o primeiro deploy.
4. Ao terminar, copie a URL de produção, por exemplo `https://orquestrador-de-sites.vercel.app`.
5. O endereço MCP será essa URL acrescida de `/mcp`.

## Configurar propostas globais de skills

O painel funciona sem credenciais para selecionar as skills existentes. Para permitir que usuários enviem novas propostas ao GitHub, configure os dois serviços abaixo.

### 1. GitHub App

Crie uma GitHub App e conceda somente estas permissões de repositório:

- **Contents: Read and write**;
- **Pull requests: Read and write**;
- **Metadata: Read-only**.

Instale a App apenas em `annygabb/Orquestrador-de-Sites`, gere uma chave privada e registre na Vercel:

```text
GITHUB_APP_ID
GITHUB_APP_INSTALLATION_ID
GITHUB_APP_PRIVATE_KEY
GITHUB_REPOSITORY=annygabb/Orquestrador-de-Sites
GITHUB_BASE_BRANCH=main
```

### 2. Cloudflare Turnstile

Crie um widget Turnstile para `orquestrador-de-sites.vercel.app` e adicione:

```text
NEXT_PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
TURNSTILE_EXPECTED_HOSTNAME=orquestrador-de-sites.vercel.app
APP_ORIGIN=https://orquestrador-de-sites.vercel.app
```

Depois de salvar as variáveis, faça um novo deployment. O segredo e a chave privada ficam apenas no backend da Vercel e nunca são enviados ao navegador.

## Conectar no ChatGPT

1. Abra **Configurações → Plugins**.
2. Clique no botão **+** e escolha criar um novo plugin/conexão MCP.
3. Preencha um nome, como `Orquestrador de Sites`.
4. Em **URL do servidor**, cole `https://SEU-PROJETO.vercel.app/mcp`.
5. Selecione **Sem autenticação**. Este servidor não usa OAuth nem acessa dados privados.
6. Confirme o aviso de servidor MCP personalizado e clique em **Criar**.

No chat, peça: `Mostre minhas skills de projeto`. Marque as opções desejadas e clique em **Confirmar seleção**. A segunda tela pede o link do chat ou do projeto.

As skills existentes entram no contexto somente depois da confirmação. Uma nova skill enviada pelo formulário gera uma branch, atualiza o catálogo central, cria seu `SKILL.md` e abre um Pull Request. Ela não fica disponível imediatamente: a publicação global ocorre somente depois da revisão e do merge por Anny.

Quando o painel está aberto dentro do ChatGPT, a seleção é enviada à conversa atual. Um link de outra conversa funciona como referência, mas não permite escrever nela. Quando o painel é aberto diretamente no navegador, ele copia um prompt pronto para ser colado no chat desejado.

Após o merge de uma proposta, a integração Git da Vercel cria um novo deployment. O site e a interface do plugin usam o mesmo catálogo publicado, portanto a nova skill passa a aparecer para todos. Se houver mudança nas ferramentas ou metadados MCP, atualize a conexão na área de Plugins do ChatGPT e abra uma nova conversa.

O endpoint `/mcp` é um endereço de protocolo para o ChatGPT, não uma página de navegação. Para visualizar o painel no navegador, abra somente a raiz do domínio, por exemplo `https://orquestrador-de-sites.vercel.app/`.

## Autoria

Idealização e requisitos de criação: **Anny Gabrielly · [@annygabb](https://github.com/annygabb)**. Todos os requisitos, decisões de produto e direcionamentos de criação deste projeto são de autoria de Anny Gabrielly.

## Desenvolvimento local

```bash
npm install
npm run dev
```

Validação:

```bash
npm run typecheck
npm run validate:skills
npm run build
```

## Fontes externas do catálogo

As opções do catálogo apontam para seus projetos oficiais ou páginas de referência. Esses projetos não são redistribuídos neste repositório; o orquestrador entrega diretivas de uso e os links de origem para consulta ou instalação quando necessário.
