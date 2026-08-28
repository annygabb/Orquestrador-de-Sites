import test from "node:test";
import assert from "node:assert/strict";
import { buildSelectionPrompt, externalResourceNotice } from "../lib/selection-prompt.ts";

const skill = { id: "review", name: "Revisão", kind: "skill", group: "Código", description: "Revise o projeto.", directive: "Verifique os testes antes de propor alterações.", source: "https://github.com/example/review" };
const reference = { id: "components", name: "Componentes externos", kind: "personalization", group: "Componentes", description: "Biblioteca para consulta.", directive: "INSTRUÇÃO QUE NÃO DEVE SER ATIVADA", source: "https://example.com/components" };
const destination = "https://chatgpt.com/c/projeto";

test("skills keep their confirmed instructions and source", () => {
  const prompt = buildSelectionPrompt([skill], destination);
  assert.ok(prompt.includes(`SKILLS CONFIRMADAS\n1. ${skill.name}`));
  assert.ok(prompt.includes(skill.directive));
  assert.ok(prompt.includes(skill.source));
  assert.ok(!prompt.includes("REFERÊNCIAS EXTERNAS"));
});

test("external-only selection is labeled as references, not activated skills", () => {
  const prompt = buildSelectionPrompt([reference], destination);
  assert.ok(prompt.includes("REFERÊNCIAS EXTERNAS — NÃO SÃO SKILLS"));
  assert.ok(prompt.includes(externalResourceNotice));
  assert.ok(prompt.includes(reference.description));
  assert.ok(prompt.includes(reference.source));
  assert.ok(!prompt.includes(reference.directive));
  assert.ok(!prompt.includes("SKILLS CONFIRMADAS\n"));
});

test("mixed selection never puts an external item into the skill section", () => {
  const prompt = buildSelectionPrompt([reference, skill], destination);
  const [skills, references] = prompt.split("REFERÊNCIAS EXTERNAS — NÃO SÃO SKILLS");
  assert.ok(skills.includes(skill.directive));
  assert.ok(!skills.includes(reference.name));
  assert.ok(references.includes(reference.name));
  assert.ok(!prompt.includes(reference.directive));
});

test("prompt preserves project scope and destination", () => {
  const prompt = buildSelectionPrompt([skill, reference], destination);
  assert.ok(prompt.includes(destination));
  assert.ok(prompt.includes("preserve o escopo"));
  assert.ok(prompt.includes("Anny Gabrielly"));
});

test("optional links do not generate undefined text", () => {
  const prompt = buildSelectionPrompt([{ ...reference, source: undefined }], destination);
  assert.ok(!prompt.includes("undefined"));
  assert.ok(!prompt.includes("Link externo:"));
});
