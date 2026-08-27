import { baseURL } from "@/baseUrl";
import { catalog, itemById } from "@/lib/catalog";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const RESOURCE_URI = "ui://orquestrador-de-sites/seletor.html?v=1";

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
                connectDomains: [baseURL],
                resourceDomains: [baseURL],
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
    "confirm_skill_selection",
    {
      title: "Confirmar seleção de skills",
      description: "Confirma as opções marcadas e devolve as instruções que devem ser aplicadas ao projeto a partir deste ponto.",
      inputSchema: {
        selectedIds: z.array(z.string()).min(1).max(catalog.length).describe("IDs selecionados na interface"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      _meta: { ui: { visibility: ["app"] } },
    },
    async ({ selectedIds }) => {
      const uniqueIds = [...new Set(selectedIds)];
      const selectedItems = uniqueIds.map((id) => itemById.get(id)).filter((item) => item !== undefined);
      if (selectedItems.length !== uniqueIds.length) {
        return { isError: true, content: [{ type: "text" as const, text: "A seleção contém uma opção desconhecida. Abra o seletor novamente." }] };
      }
      const activeSkills = selectedItems.filter((item) => item.kind === "skill");
      const personalizations = selectedItems.filter((item) => item.kind === "personalization");
      const message = `Seleção confirmada. Aplique a partir de agora estas opções neste projeto: ${selectedItems.map((item) => item.name).join(", ")}. Considere as instruções devolvidas pelo orquestrador e só altere a seleção após uma nova confirmação.`;
      return {
        content: [
          { type: "text" as const, text: message },
          { type: "text" as const, text: selectedItems.map((item, index) => `${index + 1}. ${item.name}: ${item.directive}`).join("\n") },
        ],
        structuredContent: {
          confirmed: true,
          message,
          selectedIds: uniqueIds,
          activeSkills: activeSkills.map(({ id, name, directive, source }) => ({ id, name, directive, source })),
          personalizations: personalizations.map(({ id, name, directive, source }) => ({ id, name, directive, source })),
        },
      };
    },
  );
});

export const GET = handler;
export const POST = handler;
