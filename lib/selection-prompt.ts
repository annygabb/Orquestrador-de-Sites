import type { CatalogItem } from "./catalog";

export const externalResourceNotice = "Os itens de Personalização são recursos externos, não skills. Estão neste catálogo para facilitar buscas e consultas. Selecioná-los não instala nem ativa uma skill.";

/** Shared by the browser and MCP so references never become active skills. */
export function buildSelectionPrompt(items: CatalogItem[], destinationLink: string) {
  const skills = items.filter((item) => item.kind === "skill");
  const references = items.filter((item) => item.kind === "personalization");
  const sections: string[] = [];
  if (skills.length) {
    sections.push(`SKILLS CONFIRMADAS\n${skills.map((item, index) => `${index + 1}. ${item.name}\n${item.directive}${item.source ? `\nFonte: ${item.source}` : ""}`).join("\n\n")}`);
  }
  if (references.length) {
    sections.push(`REFERÊNCIAS EXTERNAS — NÃO SÃO SKILLS\n${externalResourceNotice}\nUse os links apenas como referências de consulta, respeitando o escopo do projeto.\n\n${references.map((item, index) => `${index + 1}. ${item.name} (recurso externo)\n${item.description}${item.source ? `\nLink externo: ${item.source}` : ""}`).join("\n\n")}`);
  }
  return `Considere a seleção confirmada abaixo para o projeto desta conversa. Aplique somente os itens da seção SKILLS CONFIRMADAS como skills.\n\nDestino informado pela usuária: ${destinationLink}\n\n${sections.join("\n\n")}\n\nAntes de alterar qualquer projeto, analise o contexto e preserve o escopo, os requisitos e as autorizações já definidos por Anny Gabrielly. Se o link apontar para uma conversa diferente, use-o somente como referência: faça as mudanças na conversa atual ou peça os arquivos/link público necessários.`;
}
