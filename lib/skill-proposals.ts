import { createSign, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { z } from "zod";
import type { CatalogItem } from "./catalog";

export const skillProposalSchema = z.object({
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().min(20).max(240),
  directive: z.string().trim().min(40).max(3000),
  source: z.string().trim().url().max(500),
  turnstileToken: z.string().trim().min(1).max(3000),
  website: z.string().max(0).optional().default(""),
});

export type SkillProposal = z.infer<typeof skillProposalSchema>;

export class ProposalError extends Error {
  constructor(message: string, public status = 400, public code = "PROPOSAL_REJECTED") {
    super(message);
    this.name = "ProposalError";
  }
}

const maliciousPatterns = [
  /ignore\s+(all|any|the|as)?\s*(previous|prior|above)\s+(instructions?|rules?|messages?)/i,
  /(reveal|print|expose|leak)\s+(the\s+)?(system|developer|hidden)\s+(prompt|message|instructions?)/i,
  /(steal|exfiltrate|transmit|send)\s+.{0,40}(secrets?|tokens?|credentials?|environment variables?)/i,
  /(disable|bypass|circumvent)\s+.{0,30}(security|safeguards?|permissions?|authorization)/i,
  /act\s+as\s+(the\s+)?(system|developer)\s+(message|prompt)/i,
  /<\s*(script|iframe|object|embed)\b/i,
  /javascript\s*:/i,
];

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

function validateText(value: string) {
  if (/\p{Cc}/u.test(value.replace(/\n|\r|\t/g, ""))) {
    throw new ProposalError("A proposta contém caracteres de controle não permitidos.");
  }
  if (maliciousPatterns.some((pattern) => pattern.test(value))) {
    throw new ProposalError("A proposta contém instruções potencialmente perigosas e não pode ser enviada.");
  }
}

function validateSource(rawSource: string) {
  const source = new URL(rawSource);
  const hostname = source.hostname.toLowerCase();
  const allowedHosts = (process.env.SKILL_SOURCE_HOSTS ?? "github.com,www.github.com,gist.github.com")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  if (source.protocol !== "https:" || source.username || source.password || (source.port && source.port !== "443")) {
    throw new ProposalError("Use um link HTTPS público e sem credenciais incorporadas.");
  }
  if (hostname === "localhost" || hostname.endsWith(".local") || isIP(hostname)) {
    throw new ProposalError("Links locais, privados ou baseados em endereço IP não são aceitos.");
  }
  if (!allowedHosts.includes(hostname)) {
    throw new ProposalError("A fonte precisa estar em um domínio aprovado. Por padrão, são aceitos repositórios do GitHub.");
  }
  if ((hostname === "github.com" || hostname === "www.github.com") && source.pathname.split("/").filter(Boolean).length < 2) {
    throw new ProposalError("Informe o link completo do repositório da skill no GitHub.");
  }
  return source.toString();
}

export function normalizeProposal(input: SkillProposal) {
  const slug = slugify(input.name);
  if (slug.length < 2) throw new ProposalError("O nome não gera um identificador válido para a skill.");
  validateText(`${input.name}\n${input.description}\n${input.directive}`);
  return {
    id: slug,
    name: input.name.replace(/\s+/g, " ").trim(),
    description: input.description.replace(/\s+/g, " ").trim(),
    directive: input.directive.trim(),
    source: validateSource(input.source),
  };
}

type TurnstileResponse = {
  success: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

export async function validateTurnstile(token: string, remoteip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new ProposalError("A chave secreta do Turnstile não foi configurada. A administradora precisa revisar TURNSTILE_SECRET_KEY na Vercel.", 503, "TURNSTILE_SECRET_MISSING");
    return;
  }
  if (!token.trim()) throw new ProposalError("Conclua a verificação antes de enviar.", 403, "TURNSTILE_TOKEN_MISSING");

  const body = new URLSearchParams({ secret, response: token.trim() });
  if (remoteip && isIP(remoteip)) body.set("remoteip", remoteip);
  let result: TurnstileResponse;
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body, cache: "no-store", signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error("Siteverify indisponível");
    result = (await response.json()) as TurnstileResponse;
    if (!result || typeof result.success !== "boolean") throw new Error("Resposta inválida");
  } catch {
    throw new ProposalError("A Cloudflare não respondeu à validação. Tente novamente; seus dados foram preservados.", 503, "TURNSTILE_UNAVAILABLE");
  }
  if (!result.success) {
    const codes = Array.isArray(result["error-codes"]) ? result["error-codes"] : [];
    if (codes.includes("missing-input-secret") || codes.includes("invalid-input-secret")) {
      throw new ProposalError("A chave secreta do Turnstile foi recusada. Confira se a Site Key e a Secret Key pertencem ao mesmo widget na Cloudflare.", 503, "TURNSTILE_SECRET_INVALID");
    }
    if (codes.includes("timeout-or-duplicate")) {
      throw new ProposalError("O token expirou ou já foi utilizado. A verificação será renovada; tente enviar novamente. Seu formulário foi preservado.", 403, "TURNSTILE_TOKEN_EXPIRED");
    }
    if (codes.includes("internal-error")) {
      throw new ProposalError("A Cloudflare está temporariamente indisponível. Tente novamente em instantes.", 503, "TURNSTILE_UNAVAILABLE");
    }
    throw new ProposalError("A Cloudflare recusou o token. Tente a nova verificação; se persistir, a administradora deve conferir o par de chaves do widget.", 403, "TURNSTILE_TOKEN_INVALID");
  }
  if (result.action !== "skill_proposal") {
    throw new ProposalError("A verificação não corresponde a este formulário. Atualize a página; se persistir, a administradora deve revisar a configuração do widget.", 403, "TURNSTILE_ACTION_MISMATCH");
  }
  const configuredHostname = process.env.TURNSTILE_EXPECTED_HOSTNAME?.trim() || process.env.APP_ORIGIN?.trim();
  if (configuredHostname) {
    let expectedHostname: string;
    try {
      expectedHostname = new URL(configuredHostname.includes("://") ? configuredHostname : `https://${configuredHostname}`).hostname.toLowerCase();
    } catch {
      throw new ProposalError("TURNSTILE_EXPECTED_HOSTNAME está inválido. A administradora precisa configurar o domínio do site.", 503, "TURNSTILE_HOSTNAME_CONFIG_INVALID");
    }
    if (result.hostname?.toLowerCase() !== expectedHostname) {
      throw new ProposalError("O domínio da verificação difere do domínio configurado. A administradora deve alinhar o hostname da Cloudflare e TURNSTILE_EXPECTED_HOSTNAME na Vercel.", 403, "TURNSTILE_HOSTNAME_MISMATCH");
    }
  }
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function installationToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;
  const appId = process.env.GITHUB_APP_ID;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!appId || !installationId || !privateKey) throw new ProposalError("A integração segura com o GitHub ainda não foi configurada.", 503);

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  const jwt = `${header}.${payload}.${base64url(signer.sign(privateKey))}`;
  const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
    method: "POST",
    headers: githubHeaders(jwt),
    cache: "no-store",
  });
  const data = (await response.json()) as { token?: string; expires_at?: string; message?: string };
  if (!response.ok || !data.token || !data.expires_at) throw new ProposalError("Não foi possível autenticar a integração com o GitHub.", 502);
  tokenCache = { token: data.token, expiresAt: new Date(data.expires_at).getTime() };
  return data.token;
}

function githubHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2026-03-10",
    "User-Agent": "orquestrador-de-sites",
  };
}

async function githubRequest<T>(path: string, init: RequestInit = {}) {
  const token = await installationToken();
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: { ...githubHeaders(token), ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
    cache: "no-store",
  });
  const data = (await response.json()) as T & { message?: string };
  if (!response.ok) throw new ProposalError(`O GitHub recusou a operação: ${data.message ?? response.statusText}.`, 502);
  return data;
}

function skillMarkdown(skill: ReturnType<typeof normalizeProposal>) {
  return `---\nname: ${skill.id}\ndescription: ${JSON.stringify(skill.description)}\n---\n\n# ${skill.name}\n\n${skill.directive}\n\n## Fonte\n\n${skill.source}\n`;
}

export async function submitSkillProposal(input: SkillProposal) {
  const skill = normalizeProposal(input);
  const repository = process.env.GITHUB_REPOSITORY ?? "annygabb/Orquestrador-de-Sites";
  const baseBranch = process.env.GITHUB_BASE_BRANCH ?? "main";
  const repoPath = `/repos/${repository}`;

  const [reference, catalogFile] = await Promise.all([
    githubRequest<{ object: { sha: string } }>(`${repoPath}/git/ref/heads/${encodeURIComponent(baseBranch)}`),
    githubRequest<{ content: string; sha: string }>(`${repoPath}/contents/data/skills.json?ref=${encodeURIComponent(baseBranch)}`),
  ]);
  const currentCatalog = JSON.parse(Buffer.from(catalogFile.content.replace(/\s/g, ""), "base64").toString("utf8")) as CatalogItem[];
  const normalizedSource = skill.source.replace(/\/$/, "").toLowerCase();
  if (currentCatalog.some((item) => item.id === skill.id || item.name.toLowerCase() === skill.name.toLowerCase() || item.source?.replace(/\/$/, "").toLowerCase() === normalizedSource)) {
    throw new ProposalError("Essa skill, nome ou fonte já existe no catálogo.", 409);
  }

  const branch = `skill-proposal/${skill.id}-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;
  await githubRequest(`${repoPath}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: reference.object.sha }),
  });

  const catalogItem: CatalogItem = { ...skill, kind: "skill", group: "Comunidade", badge: "Comunidade" };
  const nextCatalog = JSON.stringify([...currentCatalog, catalogItem], null, 2) + "\n";
  await githubRequest(`${repoPath}/contents/data/skills.json`, {
    method: "PUT",
    body: JSON.stringify({
      message: `chore: propõe a skill ${skill.name}`,
      content: Buffer.from(nextCatalog).toString("base64"),
      sha: catalogFile.sha,
      branch,
    }),
  });
  await githubRequest(`${repoPath}/contents/skills/${skill.id}/SKILL.md`, {
    method: "PUT",
    body: JSON.stringify({
      message: `feat: adiciona SKILL.md de ${skill.name}`,
      content: Buffer.from(skillMarkdown(skill)).toString("base64"),
      branch,
    }),
  });

  const pullRequest = await githubRequest<{ number: number; html_url: string }>(`${repoPath}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title: `Nova skill: ${skill.name}`,
      head: branch,
      base: baseBranch,
      body: `## Proposta enviada pelo Orquestrador de Sites\n\n- **Skill:** ${skill.name}\n- **Fonte:** ${skill.source}\n\n### Verificações automáticas\n\n- Link HTTPS em domínio permitido\n- Sem duplicata no catálogo atual\n- Limites de tamanho aplicados\n- Filtros contra instruções maliciosas aplicados\n\nA publicação global só ocorrerá após revisão e merge por Anny Gabrielly.`,
      maintainer_can_modify: true,
    }),
  });

  return { skill, pullRequestNumber: pullRequest.number, pullRequestUrl: pullRequest.html_url };
}
