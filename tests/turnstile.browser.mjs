// Optional browser regression: run with Playwright installed and a dev server
// at 127.0.0.1:3100 using NEXT_PUBLIC_TURNSTILE_SITE_KEY=local-test-site-key.
// Only the local fixture is exercised; Cloudflare and proposal writes are mocked.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-08-28T12:00:00Z') });
  await page.route('https://challenges.cloudflare.com/**', route => route.fulfill({
    contentType: 'application/javascript',
    body: `(() => {
      let nextId = 0;
      const widgets = new Map();
      window.fixture = { renders: 0, resets: 0, removes: 0, tokens: 0 };
      const issue = id => setTimeout(() => {
        const widget = widgets.get(id);
        if (widget) widget.options.callback('fixture-token-' + (++window.fixture.tokens));
      }, 1);
      window.turnstile = {
        render(container, options) {
          const id = String(++nextId);
          window.fixture.renders++;
          container.textContent = 'Verificação simulada — teste local';
          container.dataset.fixtureSize = options.size;
          widgets.set(id, { container, options });
          issue(id);
          return id;
        },
        reset(id) { window.fixture.resets++; issue(id); },
        remove(id) { window.fixture.removes++; widgets.delete(id); }
      };
    })();`,
  }));
  const submissions = [];
  await page.route('**/api/skills/submit', route => {
    submissions.push(route.request().postDataJSON());
    return route.fulfill({ status: submissions.length === 1 ? 403 : 201, contentType: 'application/json', body: JSON.stringify(
      submissions.length === 1
        ? { success: false, code: 'TURNSTILE_TOKEN_EXPIRED', message: 'Token expirado no teste. Tente novamente.' }
        : { success: true, message: 'Skill enviada para aprovação', pullRequestUrl: 'https://github.com/annygabb/Orquestrador-de-Sites/pull/999999' },
    ) });
  });
  await page.goto('http://127.0.0.1:3100');
  await page.getByRole('button', { name: 'Adicionar skill', exact: true }).click();
  await page.getByText('Verificação pronta.', { exact: false }).waitFor();
  const form = page.locator('.skill-builder-form');
  const fill = async () => {
    await form.getByLabel('Nome', { exact: false }).fill('Teste de verificação');
    await form.getByLabel('Descrição curta', { exact: false }).fill('Descrição válida para o teste local de renovação.');
    await form.getByLabel('Instruções', { exact: true }).fill('Revise a interface do projeto e preserve os dados preenchidos durante a renovação da verificação.');
    await form.getByLabel('Repositório da fonte', { exact: false }).fill('https://github.com/vercel-labs/agent-skills');
  };
  await fill();
  const firstTokenCount = await page.evaluate(() => window.fixture.tokens);
  await page.clock.fastForward(4 * 60 * 1000 + 1000);
  await page.clock.runFor(10);
  assert.ok(await page.evaluate(() => window.fixture.tokens) > firstTokenCount, 'token refreshes before five minutes');
  assert.equal(await form.getByLabel('Nome', { exact: false }).inputValue(), 'Teste de verificação');
  await form.getByRole('button', { name: 'Enviar para aprovação', exact: true }).click();
  await page.getByText('Token expirado no teste. Tente novamente.', { exact: true }).waitFor();
  await page.getByText('Verificação pronta.', { exact: false }).waitFor();
  assert.equal(submissions.length, 1, 'no automatic PR retry');
  assert.equal(await form.getByLabel('Nome', { exact: false }).inputValue(), 'Teste de verificação', 'draft survives rejection');
  await form.getByRole('button', { name: 'Enviar para aprovação', exact: true }).click();
  await page.getByText('Skill enviada para aprovação', { exact: true }).waitFor();
  assert.equal(submissions.length, 2);
  assert.notEqual(submissions[0].turnstileToken, submissions[1].turnstileToken, 'retry must use a new token');
  assert.equal(await form.getByLabel('Nome', { exact: false }).inputValue(), '', 'clears only after success');
  await fill();
  await page.getByRole('button', { name: 'Fechar formulário', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar skill', exact: true }).click();
  await page.getByText('Verificação pronta.', { exact: false }).waitFor();
  assert.ok(await page.evaluate(() => window.fixture.renders) >= 2, 'widget renders when reopened');
  assert.equal(await form.getByLabel('Nome', { exact: false }).inputValue(), 'Teste de verificação');
  await page.clock.fastForward(21 * 60 * 1000);
  await page.getByRole('button', { name: 'Verificar novamente', exact: true }).waitFor();
  assert.equal(await form.getByRole('button', { name: 'Enviar para aprovação', exact: true }).isDisabled(), true, '25-minute gate blocks submit');
  assert.equal(await form.getByLabel('Nome', { exact: false }).inputValue(), 'Teste de verificação');
  await page.getByRole('button', { name: 'Verificar novamente', exact: true }).click();
  await page.getByText('Verificação pronta.', { exact: false }).waitFor();
  assert.equal(await form.getByRole('button', { name: 'Enviar para aprovação', exact: true }).isEnabled(), true);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole('button', { name: 'Fechar formulário', exact: true }).click();
    await page.getByRole('button', { name: 'Adicionar skill', exact: true }).click();
    await page.getByText('Verificação pronta.', { exact: false }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'no horizontal overflow at ' + width);
    if (width === 320) assert.equal(await page.locator('[data-fixture-size]').getAttribute('data-fixture-size'), 'compact');
  }
  assert.deepEqual(errors, []);
  console.log('Browser checks passed: refresh, rejected retry, token single-use, success, reopen, 25-minute gate, 320/390/768/1280px. External services mocked; no PR created.');
} finally {
  await browser.close();
}
