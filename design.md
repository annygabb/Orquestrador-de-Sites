# Design: Orquestrador de Sites

Sistema visual único para a landing page, painel, conta e documentos do produto.

## Genre

Editorial direto na página de marketing, com azul-cobalto, azul-marinho e off-white; profissional e orientado a confiança nas áreas operacionais.

## Macrostructure family

- Marketing: Product Transformation Story com hero azul-marinho, celular transparente em perspectiva, scrollytelling das skills, simulação antes/depois em vidro luminoso, demonstração real, motivo para assinar, preço e chamada final.
- App: workbench responsivo com fluxo em três etapas e cards funcionais.
- Conteúdo: leitura longa com título, resumo, texto e documentos relacionados.

## Theme

Todos os valores ficam em `tokens.css`. O produto mantém azul-cobalto como destaque funcional, azul-marinho para contraste e off-white como base em marketing e autenticação. Estados de sucesso, alerta e erro mantêm uso semântico.

## Typography

- Display: Fraunces Variable, 650 a 780, normal, inspirado na presença retro e luxuosa da Salty Ages sem redistribuir a fonte comercial.
- Body: DM Sans Variable, 400 a 700.
- Utility: IBM Plex Mono, 500 a 700.

## Spacing and shape

Escala de 4 pontos. Inputs usam raio de 12 px, cards 16 px e painéis 24 px. Elementos interativos têm alvo mínimo de 44 px.

## Motion

GSAP coordena entrada, desenho de linha, gráficos e scrollytelling; Framer Motion transforma a interface dentro do celular e permite rotação direta por cursor ou arraste; Lenis suaviza a rolagem em dispositivos compatíveis. O preloader dura menos de um segundo. `prefers-reduced-motion` remove movimento espacial e preserva o conteúdo estático.

## Interaction

Foco visível, estados de hover, active, disabled, loading, error e success. Sucesso silencioso sempre que o estado da tela já comunicar o resultado.

## CTA voice

Botão primário preenchido em azul. Botão secundário transparente com borda. Textos descrevem a ação concreta.

## Per-page allowances

- Marketing pode usar dois focos de luz CSS discretos, linha autodesenhada, gráfico simulado e o console real do seletor.
- A assinatura visual de marketing é o celular em perspectiva que evolui com cada grupo de skills durante a rolagem.
- App não usa elementos decorativos sem função.
- Conteúdo legal prioriza leitura e transparência.

## Shared rules

Todas as páginas compartilham wordmark, paleta, tipografia, foco, botões, espaçamento e tema escuro. Nenhuma tela armazena autenticação no localStorage.

## Exports

`tokens.css` é a fonte canônica e executável. Os mapeamentos portáteis abaixo usam os mesmos papéis sem criar uma segunda identidade.

### Tailwind v4 `@theme`

```css
@theme {
  --color-paper: oklch(98.2% 0.006 240);
  --color-ink: oklch(22% 0.035 255);
  --color-accent: oklch(50% 0.19 255);
  --color-focus: oklch(62% 0.2 252);
  --font-display: "Space Grotesk Variable", sans-serif;
  --font-body: "DM Sans Variable", sans-serif;
  --font-utility: "IBM Plex Mono", monospace;
  --spacing-md: 1.5rem;
  --radius-card: 1rem;
  --radius-input: 0.75rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG `tokens.json`

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "paper": { "$value": "oklch(98.2% 0.006 240)", "$type": "color" },
    "ink": { "$value": "oklch(22% 0.035 255)", "$type": "color" },
    "accent": { "$value": "oklch(50% 0.19 255)", "$type": "color" },
    "focus": { "$value": "oklch(62% 0.2 252)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Space Grotesk Variable, sans-serif", "$type": "fontFamily" },
    "body": { "$value": "DM Sans Variable, sans-serif", "$type": "fontFamily" }
  },
  "space": { "md": { "$value": "1.5rem", "$type": "dimension" } }
}
```

### shadcn/ui

```css
:root {
  --background: 98.2% 0.006 240;
  --foreground: 22% 0.035 255;
  --card: 99.4% 0.005 245;
  --card-foreground: 22% 0.035 255;
  --primary: 50% 0.19 255;
  --primary-foreground: 99% 0.003 250;
  --muted: 95.8% 0.012 245;
  --muted-foreground: 46% 0.035 252;
  --border: 88% 0.018 248;
  --input: 72% 0.03 250;
  --ring: 62% 0.2 252;
  --radius: 1rem;
}
```
