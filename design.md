# Design: Orquestrador de Sites

Sistema visual único para a landing page, painel, conta e documentos do produto.

## Genre

Modern-minimal, profissional, direto e orientado a confiança.

## Macrostructure family

- Marketing: console de produto interativo, transformação, responsabilidade, preço e chamada final.
- App: workbench responsivo com fluxo em três etapas e cards funcionais.
- Conteúdo: leitura longa com título, resumo, texto e documentos relacionados.

## Theme

Todos os valores ficam em `tokens.css`. O azul-cobalto é o único destaque principal. Estados de sucesso, alerta e erro têm uso semântico.

## Typography

- Display: Space Grotesk Variable, 680 a 720, normal.
- Body: DM Sans Variable, 400 a 700.
- Utility: IBM Plex Mono, 500 a 700.

## Spacing and shape

Escala de 4 pontos. Inputs usam raio de 12 px, cards 16 px e painéis 24 px. Elementos interativos têm alvo mínimo de 44 px.

## Motion

Movimento discreto em transformação e opacidade. A preferência `prefers-reduced-motion` reduz transições para até 150 ms.

## Interaction

Foco visível, estados de hover, active, disabled, loading, error e success. Sucesso silencioso sempre que o estado da tela já comunicar o resultado.

## CTA voice

Botão primário preenchido em azul. Botão secundário transparente com borda. Textos descrevem a ação concreta.

## Per-page allowances

- Marketing pode usar gradiente CSS discreto e o console real do seletor.
- App não usa elementos decorativos sem função.
- Conteúdo legal prioriza leitura e transparência.

## Shared rules

Todas as páginas compartilham wordmark, paleta, tipografia, foco, botões, espaçamento e tema escuro. Nenhuma tela armazena autenticação no localStorage.

## Exports

Os formatos CSS, Tailwind, DTCG e shadcn são derivados de `tokens.css`. O projeto usa CSS nativo, portanto `tokens.css` é o export executável e fonte canônica.
