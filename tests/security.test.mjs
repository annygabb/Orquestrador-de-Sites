import test from "node:test";
import assert from "node:assert/strict";
import { isValidCpf, normalizeCpf } from "../lib/cpf.ts";
import { createAccessToken, hashAccessToken } from "../lib/access-token.ts";
import { escapeHtml } from "../lib/html.ts";
import { readFile } from "node:fs/promises";

test("normaliza e valida CPF com dígitos verificadores", () => {
  assert.equal(normalizeCpf("529.982.247-25"), "52998224725");
  assert.equal(isValidCpf("529.982.247-25"), true);
  assert.equal(isValidCpf("111.111.111-11"), false);
  assert.equal(isValidCpf("529.982.247-24"), false);
});

test("conteúdo de e-mail codifica HTML fornecido pelo usuário", () => {
  assert.equal(escapeHtml(`<img src=x onerror="alert(1)">`), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
});

test("template de e-mail usa o mesmo escape para nome e URL", async () => {
  const email = await readFile(new URL("../lib/email-template.ts", import.meta.url), "utf8");
  assert.match(email, /const safeName = escapeHtml\(name\)/);
  assert.match(email, /const safeManageUrl = escapeHtml\(manageUrl\)/);
  assert.match(email, /Seu processo começa agora/);
  assert.match(email, /background:#a7ff20/);
});

test("token MCP é aleatório e somente o hash é persistível", () => {
  const first = createAccessToken();
  const second = createAccessToken();
  assert.match(first.plain, /^os_[A-Za-z0-9_-]{40}$/);
  assert.notEqual(first.plain, second.plain);
  assert.notEqual(first.hash, first.plain);
  assert.equal(first.hash, hashAccessToken(first.plain));
});

test("variáveis privadas não usam prefixo público e storage não recebe autenticação", async () => {
  const env = await readFile(new URL("../.env.example", import.meta.url), "utf8");
  const theme = await readFile(new URL("../app/components/theme-toggle.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(env, /NEXT_PUBLIC_(?:SUPABASE|ASAAS|GITHUB|RESEND|TURNSTILE)/);
  assert.doesNotMatch(theme, /(?:token|session|email|cpf).*localStorage/i);
});
