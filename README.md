# Orquestrador de Sites

MCP App com uma interface completa de seleção: checkboxes, busca, filtros, contador e botão **Confirmar seleção**. A confirmação devolve ao ChatGPT as instruções das skills e personalizações escolhidas, que passam a valer no projeto a partir daquele momento.

## O que está incluído

- endpoint Streamable HTTP em `/mcp`;
- interface incorporada ao ChatGPT por MCP Apps;
- formulário para adicionar skills próprias diretamente na interface;
- fluxo em três etapas: selecionar, informar destino e enviar;
- ferramentas `open_skill_selector` e `confirm_skill_selection`;
- catálogo de design, UX, revisão de código, segurança, SEO, animação, otimização de tokens, componentes e referências;
- implantação pronta para Vercel;
- skill de orquestração para empacotamento como plugin Codex.

## Publicar na Vercel

1. Entre em [vercel.com/new](https://vercel.com/new) usando sua conta GitHub.
2. Importe o repositório `annygabb/Orquestrador-de-Sites`.
3. Mantenha o framework detectado como **Next.js** e clique em **Deploy**. Nenhuma variável é obrigatória.
4. Ao terminar, copie a URL de produção, por exemplo `https://orquestrador-de-sites.vercel.app`.
5. O endereço MCP será essa URL acrescida de `/mcp`.

## Conectar no ChatGPT

1. Abra **Configurações → Plugins**.
2. Clique no botão **+** e escolha criar um novo plugin/conexão MCP.
3. Preencha um nome, como `Orquestrador de Sites`.
4. Em **URL do servidor**, cole `https://SEU-PROJETO.vercel.app/mcp`.
5. Selecione **Sem autenticação**. Este servidor não usa OAuth nem acessa dados privados.
6. Confirme o aviso de servidor MCP personalizado e clique em **Criar**.

No chat, peça: `Mostre minhas skills de projeto`. Marque as opções desejadas e clique em **Confirmar seleção**. A segunda tela pede o link do chat ou do projeto.

As skills adicionadas manualmente ficam disponíveis naquela interface e entram no contexto do chat somente depois da confirmação.

Quando o painel está aberto dentro do ChatGPT, a seleção é enviada à conversa atual. Um link de outra conversa funciona como referência, mas não permite escrever nela. Quando o painel é aberto diretamente no navegador, ele copia um prompt pronto para ser colado no chat desejado.

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
npm run build
```

## Fontes externas do catálogo

As opções do catálogo apontam para seus projetos oficiais ou páginas de referência. Esses projetos não são redistribuídos neste repositório; o orquestrador entrega diretivas de uso e os links de origem para consulta ou instalação quando necessário.
