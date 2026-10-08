import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSelectionPrompt } from '../lib/selection-prompt.ts';

const catalog = JSON.parse(readFileSync(new URL('../data/skills.json', import.meta.url), 'utf8'));
const orchestrator = readFileSync(new URL('../skills/site-orchestrator/SKILL.md', import.meta.url), 'utf8');
const expected = {
  "gradient-reference": "https://grainient.supply/",
  "design-inspiration": "https://typ.io/",
  "velvetyne-fonts": "https://velvetyne.fr/",
  "nappy-photos": "https://nappy.co/",
  "foodiesfeed-photos": "https://www.foodiesfeed.com/pt",
  "lifeofpix-photos": "https://www.lifeofpix.com/",
  "stocksy-photos": "https://www.stocksy.com/",
  "spell-components": "https://spell.sh/",
  "inspora-design": "https://www.inspora.design/",
  "refero-styles": "https://styles.refero.design/"
};

test('requested resources have stable IDs, exact links and external classification', () => {
  for (const [id, source] of Object.entries(expected)) {
    const matches = catalog.filter(item => item.id === id);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].source, source);
    assert.equal(matches[0].kind, 'personalization');
    assert.match(matches[0].description, /Recurso externo, não é uma skill/);
  }
});

test('new references never become executable skills in generated instructions', () => {
  const items = catalog.filter(item => Object.hasOwn(expected, item.id));
  const prompt = buildSelectionPrompt(items, 'https://chatgpt.com/');
  assert.match(prompt, /REFERÊNCIAS EXTERNAS — NÃO SÃO SKILLS/);
  assert.doesNotMatch(prompt, /SKILLS CONFIRMADAS\n/);
  for (const source of Object.values(expected)) assert.ok(prompt.includes(source));
});

test('old gradient and generic inspiration links are replaced without removing community skill', () => {
  assert.ok(!catalog.some(item => ['https://vt.tiktok.com/ZSVHL6Lky/', 'https://vt.tiktok.com/ZSVHLfnRh/'].includes(item.source)));
  assert.equal(catalog.find(item => item.id === 'vercel-react-best-practices')?.kind, 'skill');
  assert.equal(new Set(catalog.map(item => item.id)).size, catalog.length);
});

test('orchestration skills are cataloged with safe routing and installation rules', () => {
  const usingSuperpowers = catalog.find(item => item.id === 'using-superpowers');
  const findSkills = catalog.find(item => item.id === 'find-skills');
  const revenue = catalog.find(item => item.id === 'revenue-centric-design');

  assert.equal(usingSuperpowers?.source, 'https://github.com/obra/superpowers/tree/main/skills/using-superpowers');
  assert.match(usingSuperpowers?.directive ?? '', /antes de responder ou agir/i);

  assert.equal(findSkills?.source, 'https://github.com/vercel-labs/skills/tree/main/skills/find-skills');
  assert.match(findSkills?.directive ?? '', /confirmação explícita/i);
  assert.match(findSkills?.directive ?? '', /nunca instale automaticamente/i);

  assert.equal(revenue?.source, 'https://github.com/fabricioctelles/skills/tree/main/skills/revenue-centric-design');
  assert.match(revenue?.description ?? '', /analisar páginas existentes/i);
  assert.match(revenue?.directive ?? '', /somente para analisar uma página existente/i);
  assert.doesNotMatch(orchestrator, /em tarefas de landing page.*aplique também `revenue-centric-design`/i);
  assert.match(orchestrator, /somente quando o usuário pedir uma análise de conversão/i);
  assert.match(revenue?.directive ?? '', /não use esta skill em apostas/i);

  assert.ok(!catalog.some(item => item.id === 'superpowers'));
  assert.equal(new Set(catalog.map(item => item.id)).size, catalog.length);
});

