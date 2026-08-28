import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSelectionPrompt } from '../lib/selection-prompt.ts';

const catalog = JSON.parse(readFileSync(new URL('../data/skills.json', import.meta.url), 'utf8'));
const expected = {
  "gradient-reference": "https://grainient.supply/",
  "design-inspiration": "https://typ.io/",
  "velvetyne-fonts": "https://velvetyne.fr/",
  "nappy-photos": "https://nappy.co/",
  "foodiesfeed-photos": "https://www.foodiesfeed.com/pt",
  "lifeofpix-photos": "https://www.lifeofpix.com/",
  "stocksy-photos": "https://www.stocksy.com/"
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
