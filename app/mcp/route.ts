import { baseURL } from "@/baseUrl";
import { catalog, itemById } from "@/lib/catalog";
import { ProposalError, skillProposalSchema, submitSkillProposal, validateTurnstile } from "@/lib/skill-proposals";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const RESOURCE_URI = "ui://orquestrador-de-sites/seletor.html?v=2";

async function fetchPageHtml() {
  const response = await fetch(baseURL);
  if (!response.ok) throw new Error(`Não foi possível carregar a interface: ${response.status}`);
  return response.text();
}

const handler = createMcpHandler(async (server) => {
  registerAppResource(
    server,
    "seletor-de-skills",
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => ({
      contents: [
        {
          uri: RESOURCE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: await fetchPageHtml(),
          _meta: {
            ui: {
              csp: {
                connectDomains: [baseURL, "https://challenges.cloudflare.com"],
                resourceDomains: [baseURL, "https://challenges.cloudflare.com"],
                frameDomains: ["https://challenges.cloudflare.com"],
              },
            },
          },
        },
      ],
    }),
  );

  registerAppTool(
    server,
    "open_skill_selector",
    {
      title: "Abrir seletor de skills",
      description: "Abre uma interface com checkboxes para escolher e confirmar skills e personalizações de um projeto de site.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async () => ({
      content: [{ type: "text" as const, text: "Use a interface para selecionar quantas opções quiser e confirme somente quando terminar." }],
      structuredContent: {
        catalog,
        total: catalog.length,
        instructions: "A seleção ainda não foi confirmada.",
      },
    }),
  );

  registerAppTool(
    server,
    "submit_skill_proposal",
    {
      title: "Enviar skill para aprovação",
      description: "Valida uma nova skill, cria sua pasta e SKILL.md em uma branch separada e abre um Pull Request para revisão de Anny.",
      inputSchema: skillProposalSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
      _meta: { ui: { visibility: ["app"] } },
    },
    async (proposal) => {
      try {
        const parsed = skillProposalSchema.parse(proposal);
        await validateTurnstile(parsed.turnstileToken);
        const result = await submitSkillProposal(parsed);
        return {
          content: [{ type: "text" as const, text: `Skill enviada para aprovação no Pull Request #${result.pullRequestNumber}.` }],
          structuredContent: {
            success: true,
            message: "Skill enviada para aprovação",
            pullRequestNumber: result.pullRequestNumber,
            pullRequestUrl: result.pullRequestUrl,
          },
        };
      } catch (error) {
        const message = error instanceof ProposalError ? error.message : "Não foi possível enviar a skill para aprovação.";
        return { isError: true, content: [{ type: "text" as const, text: message }], structuredContent: { success: false, message } };
      }
    },
  );

  registerAppTool(
    server,
    "confirm_skill_selection",
    {
      title: "Confirmar seleção de skills",
      description: "Confirma as opções marcadas e devolve as instruções que devem ser aplicadas ao projeto a partir deste ponto.",
      inputSchema: {
        selectedIds: z.array(z.string()).max(catalog.length).describe("IDs selecionados no catálogo"),
        destinationLink: z.string().url().max(2000).describe("Link do chat ou projeto informado na segunda etapa"),
        customSkills: z.array(z.object({
          id: z.string().startsWith("custom-").max(120),
          name: z.string().min(1).max(80),
          description: z.string().min(1).max(180),
          directive: z.string().min(1).max(2000),
          source: z.string().url().optional(),
        })).max(20).optional().describe("Skills personalizadas adicionadas na interface"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      _meta: { ui: { visibility: ["app"] } },
    },
    async ({ selectedIds, destinationLink, customSkills = [] }) => {
      const uniqueIds = [...new Set(selectedIds)];
      const catalogItems = uniqueIds.map((id) => itemById.get(id)).filter((item) => item !== undefined);
      if (catalogItems.length !== uniqueIds.length) {
        return { isError: true, content: [{ type: "text" as const, text: "A seleção contém uma opção desconhecida. Abra o seletor novamente." }] };
      }
      const uniqueCustomSkills = [...new Map(customSkills.map((item) => [item.id, item])).values()];
      const customItems = uniqueCustomSkills.map((item) => ({
        ...item,
        kind: "skill" as const,
        group: "Personalizadas",
        badge: "Sua skill",
      }));
      const selectedItems = [...catalogItems, ...customItems];
      if (selectedItems.length === 0) {
        return { isError: true, content: [{ type: "text" as const, text: "Selecione pelo menos uma opção antes de confirmar." }] };
      }
      const activeSkills = selectedItems.filter((item) => item.kind === "skill");
      const personalizations = selectedItems.filter((item) => item.kind === "personalization");
      const message = `Seleção confirmada. Aplique a partir de agora estas opções neste projeto: ${selectedItems.map((item) => item.name).join(", ")}. Considere as instruções devolvidas pelo orquestrador e só altere a seleção após uma nova confirmação.`;
      const prompt = `Aplique as skills e personalizações confirmadas abaixo ao projeto desta conversa.\n\nDestino informado pela usuária: ${destinationLink}\n\nSKILLS CONFIRMADAS\n${selectedItems.map((item, index) => `${index + 1}. ${item.name}\n${item.directive}${item.source ? `\nFonte: ${item.source}` : ""}`).join("\n\n")}\n\nAntes de alterar qualquer projeto, analise o contexto e preserve o escopo, os requisitos e as autorizações já definidos por Anny Gabrielly. Se o link apontar para uma conversa diferente, use-o somente como referência: faça as mudanças na conversa atual ou peça os arquivos/link público necessários.`;
      return {
        content: [
          { type: "text" as const, text: message },
          { type: "text" as const, text: selectedItems.map((item, index) => `${index + 1}. ${item.name}: ${item.directive}`).join("\n") },
        ],
        structuredContent: {
          confirmed: true,
          message,
          prompt,
          destinationLink,
          selectedIds: selectedItems.map((item) => item.id),
          activeSkills: activeSkills.map(({ id, name, directive, source }) => ({ id, name, directive, source })),
          personalizations: personalizations.map(({ id, name, directive, source }) => ({ id, name, directive, source })),
        },
      };
    },
  );
});

export const GET = handler;
export const POST = handler;
