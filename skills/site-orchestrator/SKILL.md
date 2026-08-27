---
name: site-orchestrator
description: Orquestra a criação ou revisão de um site quando o usuário quer escolher manualmente skills e referências antes de aplicá-las ao projeto.
---

# Orquestrador de Sites

Quando o usuário pedir para ver, escolher ou alterar as skills do projeto, chame `open_skill_selector` e aguarde a confirmação feita na interface.

Não trate caixas marcadas como ativas antes do retorno de `confirm_skill_selection`. Depois da confirmação:

- aplique somente as instruções devolvidas em `activeSkills` e `personalizations`;
- mantenha a seleção ativa no contexto da conversa até o usuário confirmar outra;
- use links de referência como inspiração, não como autorização para copiar conteúdo ou identidade de terceiros;
- se uma opção depender de uma ferramenta indisponível, explique a limitação e siga com a alternativa mais próxima;
- preserve o escopo e as autorizações originais do pedido.

Palavras como “skills”, “mostrar opções”, “personalizar sistema”, “trocar seleção” e “orquestrador” devem abrir o seletor quando isso ajudar o fluxo.
