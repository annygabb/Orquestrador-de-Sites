import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { validateTurnstile, ProposalError } from '../lib/skill-proposals.ts';
import { TurnstileClock, PANEL_RECHECK_MS, TOKEN_REFRESH_MS } from '../lib/turnstile-clock.ts';

const envNames = ['NODE_ENV', 'TURNSTILE_SECRET_KEY', 'TURNSTILE_EXPECTED_HOSTNAME', 'APP_ORIGIN'];
const originalEnv = Object.fromEntries(envNames.map(name => [name, process.env[name]]));
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const name of envNames) {
    if (originalEnv[name] === undefined) delete process.env[name];
    else process.env[name] = originalEnv[name];
  }
});

function setup(result, status = 200) {
  process.env.NODE_ENV = 'production';
  process.env.TURNSTILE_SECRET_KEY = 'test-server-secret';
  process.env.TURNSTILE_EXPECTED_HOSTNAME = 'orquestradordesites.vercel.app';
  delete process.env.APP_ORIGIN;
  globalThis.fetch = async () => new Response(JSON.stringify(result), { status });
}
const valid = { success: true, action: 'skill_proposal', hostname: 'orquestradordesites.vercel.app' };
const rejectsWith = code => error => error instanceof ProposalError && error.code === code && !error.message.includes('test-server-secret');

test('validates a fresh token with the correct action and hostname', async () => {
  setup(valid);
  await validateTurnstile('fresh-token');
});
test('posts trimmed credentials via Siteverify with a timeout and no caching', async () => {
  setup(valid);
  process.env.TURNSTILE_SECRET_KEY = ' test-server-secret\n';
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    assert.equal(options.body.get('secret'), 'test-server-secret');
    assert.equal(options.body.get('response'), 'fresh-token');
    assert.equal(options.body.get('remoteip'), null);
    assert.equal(options.cache, 'no-store');
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json(valid);
  };
  await validateTurnstile(' fresh-token ', 'invalid-ip');
});
for (const [providerCode, expectedCode] of [
  ['timeout-or-duplicate', 'TURNSTILE_TOKEN_EXPIRED'],
  ['invalid-input-secret', 'TURNSTILE_SECRET_INVALID'],
  ['missing-input-secret', 'TURNSTILE_SECRET_INVALID'],
  ['invalid-input-response', 'TURNSTILE_TOKEN_INVALID'],
  ['internal-error', 'TURNSTILE_UNAVAILABLE'],
  ['unknown-code', 'TURNSTILE_TOKEN_INVALID'],
]) test(`distinguishes ${providerCode}`, async () => {
  setup({ success: false, 'error-codes': [providerCode] });
  await assert.rejects(validateTurnstile('fresh-token'), rejectsWith(expectedCode));
});
test('rejects missing secret in production without making a request', async () => {
  setup(valid); delete process.env.TURNSTILE_SECRET_KEY;
  globalThis.fetch = () => { throw Error('must not fetch'); };
  await assert.rejects(validateTurnstile('fresh-token'), rejectsWith('TURNSTILE_SECRET_MISSING'));
});
test('rejects an empty token', async () => {
  setup(valid);
  await assert.rejects(validateTurnstile(' '), rejectsWith('TURNSTILE_TOKEN_MISSING'));
});
test('does not accept a different action', async () => {
  setup({ ...valid, action: 'other_form' });
  await assert.rejects(validateTurnstile('fresh-token'), rejectsWith('TURNSTILE_ACTION_MISMATCH'));
});
test('does not accept a different hostname', async () => {
  setup({ ...valid, hostname: 'attacker.example' });
  await assert.rejects(validateTurnstile('fresh-token'), rejectsWith('TURNSTILE_HOSTNAME_MISMATCH'));
});
test('normalizes URL and whitespace in the hostname configuration', async () => {
  setup(valid); process.env.TURNSTILE_EXPECTED_HOSTNAME = ' https://ORQUESTRADORDESITES.vercel.app/ ';
  await validateTurnstile('fresh-token');
});
test('falls back to APP_ORIGIN for hostname validation', async () => {
  setup({ ...valid, hostname: 'other.example' });
  delete process.env.TURNSTILE_EXPECTED_HOSTNAME;
  process.env.APP_ORIGIN = 'https://orquestradordesites.vercel.app';
  await assert.rejects(validateTurnstile('fresh-token'), rejectsWith('TURNSTILE_HOSTNAME_MISMATCH'));
});
test('explains malformed hostname configuration', async () => {
  setup(valid); process.env.TURNSTILE_EXPECTED_HOSTNAME = 'not a hostname';
  await assert.rejects(validateTurnstile('fresh-token'), rejectsWith('TURNSTILE_HOSTNAME_CONFIG_INVALID'));
});
for (const invalid of [null, { success: 'true' }]) test(`rejects malformed response ${JSON.stringify(invalid)}`, async () => {
  setup(invalid);
  await assert.rejects(validateTurnstile('fresh-token'), rejectsWith('TURNSTILE_UNAVAILABLE'));
});
test('distinguishes HTTP failure from token expiry', async () => {
  setup({}, 503);
  await assert.rejects(validateTurnstile('fresh-token'), rejectsWith('TURNSTILE_UNAVAILABLE'));
});
test('does not leak network error details', async () => {
  setup(valid); globalThis.fetch = async () => { throw Error('test-server-secret'); };
  await assert.rejects(validateTurnstile('fresh-token'), rejectsWith('TURNSTILE_UNAVAILABLE'));
});
test('validates every submission and rejects replay', async () => {
  setup(valid); let calls = 0;
  globalThis.fetch = async () => Response.json(++calls === 1 ? valid : { success: false, 'error-codes': ['timeout-or-duplicate'] });
  await validateTurnstile('same-token');
  await assert.rejects(validateTurnstile('same-token'), rejectsWith('TURNSTILE_TOKEN_EXPIRED'));
  assert.equal(calls, 2);
});
test('a client token can be taken only once', () => {
  const clock = new TurnstileClock(0); clock.issue('one', 1);
  assert.equal(clock.take(2), 'one'); assert.equal(clock.take(3), null);
});
test('refreshes before the provider five-minute expiry', () => {
  const clock = new TurnstileClock(0); clock.issue('one', 0);
  assert.equal(clock.isFresh(TOKEN_REFRESH_MS - 1), true);
  assert.equal(clock.take(TOKEN_REFRESH_MS), null);
});
test('background token refresh does not extend the 25-minute deadline', () => {
  const clock = new TurnstileClock(0); clock.issue('refreshed', PANEL_RECHECK_MS - 1);
  assert.equal(clock.needsRecheck(PANEL_RECHECK_MS - 1), false);
  assert.equal(clock.needsRecheck(PANEL_RECHECK_MS), true);
  assert.equal(clock.take(PANEL_RECHECK_MS), null);
});
test('new tokens cannot bypass a due panel recheck', () => {
  const clock = new TurnstileClock(0); clock.issue('new', PANEL_RECHECK_MS + 1);
  assert.equal(clock.take(PANEL_RECHECK_MS + 2), null);
});
test('closing the form clears the token but not the panel deadline', () => {
  const clock = new TurnstileClock(0); clock.issue('one', 10); clock.clear();
  assert.equal(clock.take(11), null); assert.equal(clock.needsRecheck(PANEL_RECHECK_MS), true);
});
test('explicit recheck requires a new token and starts a new window', () => {
  const clock = new TurnstileClock(0); clock.restartWindow(PANEL_RECHECK_MS);
  assert.equal(clock.take(PANEL_RECHECK_MS), null);
  clock.issue('new', PANEL_RECHECK_MS + 1);
  assert.equal(clock.take(PANEL_RECHECK_MS + 2), 'new');
  assert.equal(clock.needsRecheck(2 * PANEL_RECHECK_MS), true);
});
