import { baseURL } from "@/baseUrl";
import { prepareMcpPage } from "@/lib/mcp-page";
import { catalog, itemById } from "@/lib/catalog";
import { buildSelectionPrompt, externalResourceNotice } from "@/lib/selection-prompt";
import { ProposalError, skillProposalSchema, submitSkillProposal, validateTurnstile } from "@/lib/skill-proposals";
import { entitlementResponse, requestEntitlement } from "@/lib/entitlements";
import { AsyncLocalStorage } from "node:async_hooks";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const RESOURCE_URI = "ui://orquestrador-de-sites/seletor.html?v=6";
const requestContext = new AsyncLocalStorage<{ authorization: string; origin: string }>();

async function requireMcpAccess() {
  const authorization = requestContext.getStore()?.authorization || "";
  const entitlement = await requestEntitlement(new Request("https://internal.local/mcp", { headers: { authorization } }));
  if (!entitlement.allowed) throw new ProposalError("Sua assinatura não está ativa. Abra o perfil para regularizar o acesso.", 402, "SUBSCRIPTION_REQUIRED");
  return authorization;
}

async function fetchPageHtml() {
  const authorization = await requireMcpAccess();
  const origin = requestContext.getStore()?.origin ?? baseURL;
  const response = await fetch(new URL("/painel", origin), { headers: { authorization }, cache: "no-store" });
  if (!response.ok) throw new Error(`Não foi possível carregar a interface: ${response.status}`);
  return prepareMcpPage(await response.text());
}

const handler = createMcpHandler(async (server) => {
  registerAppResource(
    server,
    "seletor-de-skills",
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      await requireMcpAccess();
      const origin = requestContext.getStore()?.origin ?? baseURL;
      return { contents: [
        {
          uri: RESOURCE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: await fetchPageHtml(),
          _meta: {
            ui: {
              csp: {
                connectDomains: [origin, "https://challenges.cloudflare.com"],
                resourceDomains: [origin, "https://challenges.cloudflare.com"],
                frameDomains: ["https://challenges.cloudflare.com"],
              },
            },
          },
        },
      ] };
    },
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
    async () => {
      await requireMcpAccess();
      return { content: [{ type: "text" as const, text: `Use a interface para selecionar quantas opções quiser e confirme somente quando terminar. ${externalResourceNotice}` }], structuredContent: {
        catalog,
        total: catalog.length,
        instructions: "A seleção ainda não foi confirmada.",
        personalizationNotice: externalResourceNotice,
      } };
    },
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
        await requireMcpAccess();
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
        return { isError: true, content: [{ type: "text" as const, text: message }], structuredContent: { success: false, message, code: error instanceof ProposalError ? error.code : "PROPOSAL_FAILED" } };
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
      await requireMcpAccess();
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
      const message = `Seleção confirmada: ${activeSkills.length} skills e ${personalizations.length} recursos externos. Só altere a seleção após uma nova confirmação.${personalizations.length ? ` ${externalResourceNotice}` : ""}`;
      const prompt = buildSelectionPrompt(selectedItems, destinationLink);
      return {
        content: [
          { type: "text" as const, text: message },
          { type: "text" as const, text: prompt },
        ],
        structuredContent: {
          confirmed: true,
          message,
          prompt,
          destinationLink,
          selectedIds: selectedItems.map((item) => item.id),
          activeSkills: activeSkills.map(({ id, name, directive, source }) => ({ id, name, directive, source })),
          personalizations: personalizations.map(({ id, name, description, source }) => ({ id, name, description, source, kind: "personalization", isSkill: false, purpose: "Referência externa para facilitar buscas e consultas" })),
        },
      };
    },
  );
});

async function protectedHandler(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const entitlement = await requestEntitlement(request);
  if (!entitlement.allowed) return entitlementResponse(entitlement);
  return requestContext.run({ authorization, origin: new URL(request.url).origin }, () => handler(request));
}

export const GET = protectedHandler;
export const POST = protectedHandler;
