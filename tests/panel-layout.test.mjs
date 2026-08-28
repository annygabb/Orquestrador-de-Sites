import test from 'node:test';
import assert from 'node:assert/strict';
import { paginateCatalog, addVisibleSelection } from '../lib/panel-layout.ts';
import { prepareMcpPage } from '../lib/mcp-page.ts';

const catalog = Array.from({ length: 38 }, (_, i) => `skill-${i}`);
test('inline chat shows six cards; expanded chat shows twelve', () => {
  assert.equal(paginateCatalog(catalog, 0, 6).items.length, 6);
  assert.equal(paginateCatalog(catalog, 0, 12).items.length, 12);
});
test('all entries remain reachable, including the last partial page', () => {
  const pages = Array.from({ length: 7 }, (_, page) => paginateCatalog(catalog, page, 6).items);
  assert.deepEqual(pages.flat(), catalog);
  assert.equal(pages.at(-1).length, 2);
});
test('filtering and removing selected items clamps the current page', () => {
  assert.equal(paginateCatalog(catalog.slice(0, 2), 6, 6).currentPage, 0);
  assert.deepEqual(paginateCatalog([], 4, 6).items, []);
  assert.equal(paginateCatalog([], 4, 6).totalPages, 1);
});
test('select visible adds to previous pages without clearing or duplicating', () => {
  const previous = new Set(['skill-0', 'skill-1']);
  const next = addVisibleSelection(previous, ['skill-1', 'skill-8']);
  assert.deepEqual([...next], ['skill-0', 'skill-1', 'skill-8']);
  assert.deepEqual([...previous], ['skill-0', 'skill-1']);
});
test('MCP markup opts into compact layout before hydration and preserves assets', () => {
  const html = '<!DOCTYPE html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body>Panel</body></html>';
  assert.equal(prepareMcpPage(html), html.replace('<html ', '<html data-embedded="true" data-display-mode="inline" '));
});
