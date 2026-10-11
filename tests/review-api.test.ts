import assert from 'node:assert/strict';
import test from 'node:test';
import { createReviewHandler, publicReviewConfig, type ReviewAuthentication } from '../api/review.js';
import { ReviewAccessError } from '../lib/review/auth.js';
import { ReviewEngineError } from '../lib/review/github.js';
import { ReviewStoreError } from '../lib/review/store.js';
import { REVIEW_MAX_BODY_BYTES, reviewActionSchema, reviewActionSchemas, reviewOpenApiDocument } from '../lib/review/request.js';
import type { HttpRequest, HttpResponse } from '../lib/http.js';

const organizationId = '11111111-1111-4111-8111-111111111111';
const recordId = '22222222-2222-4222-8222-222222222222';
const authenticated = { userId: recordId, email: 'test@example.invalid', client: {} } as ReviewAuthentication;
const env = { APP_ORIGIN: 'https://sparecycle-topaz.vercel.app', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_only', NEBIUS_API_KEY: 'private-nebius-key', GITHUB_APP_ID: '123', GITHUB_APP_PRIVATE_KEY: 'private-github-key', GITHUB_APP_SLUG: 'sparecycle-test', NEBIUS_PROJECT_ID: 'private-project-id', NEBIUS_SANDBOX_IMAGE_ID: recordId, LANGSMITH_API_KEY: 'private-langsmith-key', REVIEW_WORKER_SECRET: 'private-worker-key' };
function request(body: unknown = { action: 'organizations' }, headers: Record<string, string | string[]> = {}, method = 'POST'): HttpRequest {
  return { method, body, headers: { host: 'sparecycle-topaz.vercel.app', origin: 'https://sparecycle-topaz.vercel.app', 'content-type': 'application/json', authorization: 'Bearer test-token-with-at-least-twenty-characters', ...headers } } as unknown as HttpRequest;
}
function response() {
  const state = { status: 200, body: undefined as unknown, headers: {} as Record<string, string> };
  const res = { setHeader(name: string, value: string) { state.headers[name] = value; return res; }, status(code: number) { state.status = code; return res; }, json(body: unknown) { state.body = body; return res; } } as unknown as HttpResponse;
  return { state, res };
}
async function call(handler: ReturnType<typeof createReviewHandler>, req = request()) { const { state, res } = response(); await handler(req, res); return state; }
function safeHandler(options: Parameters<typeof createReviewHandler>[0] = {}) { return createReviewHandler({ env, authenticate: async () => authenticated, invoke: async () => ({ ok: true }), ...options }); }

test('public Review configuration exposes only publishable auth and model metadata', async () => {
  let accessed = false;
  const result = await call(safeHandler({ authenticate: async () => { accessed = true; return authenticated; } }), request(undefined, {}, 'GET'));
  assert.equal(result.status, 200); assert.equal(accessed, false);
  const config = result.body as ReturnType<typeof publicReviewConfig>;
  assert.equal(config.authConfigured, true); assert.equal(config.supabasePublishableKey, env.SUPABASE_PUBLISHABLE_KEY);
  assert.equal(config.githubInstallUrl, 'https://github.com/apps/sparecycle-test/installations/new');
  assert.equal(config.nebiusConfigured, true); assert.equal(config.sandboxConfigured, true);
  const serialized = JSON.stringify(config);
  for (const secret of ['private-nebius-key', 'private-github-key', 'private-project-id', 'private-langsmith-key', 'private-worker-key']) assert.equal(serialized.includes(secret), false);
  assert.equal(config.models.some(model => model.tier === 'ultra'), false);
});

test('secret or service-role keys in public auth settings fail closed', () => {
  for (const key of ['sb_secret_do_not_expose', `header.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`]) {
    const config = publicReviewConfig({ ...env, SUPABASE_PUBLISHABLE_KEY: key });
    assert.equal(config.authConfigured, false); assert.equal(config.supabasePublishableKey, null); assert.equal(config.supabaseUrl, null);
  }
});

test('unconfigured services return honest false flags and Ultra requires explicit opt-in', () => {
  const config = publicReviewConfig({});
  assert.equal(config.authConfigured, false); assert.equal(config.githubConfigured, false); assert.equal(config.sandboxConfigured, false); assert.equal(config.nebiusConfigured, false);
  assert.equal(publicReviewConfig({ ...env, NEBIUS_REVIEW_ALLOW_ULTRA: 'true' }).models.some(model => model.tier === 'ultra'), true);
  assert.equal(publicReviewConfig({ GITHUB_APP_INSTALL_URL: 'https://attacker.invalid/apps/foo/installations/new' }).githubInstallUrl, null);
});

test('Google login is an explicit operator option and requires valid Supabase auth configuration',()=>{
  assert.equal(publicReviewConfig(env).googleSignInEnabled,false);
  assert.equal(publicReviewConfig({...env,REVIEW_GOOGLE_SIGN_IN_ENABLED:'true'}).googleSignInEnabled,true);
  for(const value of ['false','TRUE','1','yes',' true ']) assert.equal(publicReviewConfig({...env,REVIEW_GOOGLE_SIGN_IN_ENABLED:value}).googleSignInEnabled,false);
  assert.equal(publicReviewConfig({REVIEW_GOOGLE_SIGN_IN_ENABLED:'true'}).googleSignInEnabled,false);
  assert.equal(publicReviewConfig({...env,SUPABASE_PUBLISHABLE_KEY:'sb_secret_not_publishable',REVIEW_GOOGLE_SIGN_IN_ENABLED:'true'}).googleSignInEnabled,false);
  const config=JSON.stringify(publicReviewConfig({...env,REVIEW_GOOGLE_SIGN_IN_ENABLED:'true',GOOGLE_CLIENT_SECRET:'private-google-secret'}));
  assert.equal(config.includes('private-google-secret'),false);
  assert.equal(config.includes('ssoEnforced'),false);
});

test('custom OIDC login configuration requires explicit enablement and exposes no IdP secrets', () => {
  const configured = { ...env, REVIEW_SSO_ENABLED: 'true', REVIEW_SSO_PROVIDER_ID: 'custom:company', REVIEW_SSO_DISPLAY_NAME: 'Company identity', SSO_CLIENT_SECRET: 'private-idp-secret', SSO_ISSUER: 'private-idp-issuer' };
  assert.deepEqual(publicReviewConfig(configured).ssoProvider, { id: 'custom:company', label: 'Company identity' });
  assert.equal(publicReviewConfig(env).ssoProvider, null);
  assert.equal(publicReviewConfig({ ...configured, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_not_public' }).ssoProvider, null);
  for (const enabled of ['false', 'TRUE', '1', ' true ']) assert.equal(publicReviewConfig({ ...configured, REVIEW_SSO_ENABLED: enabled }).ssoProvider, null);
  const serialized = JSON.stringify(publicReviewConfig(configured));
  assert.doesNotMatch(serialized, /private-idp-secret|private-idp-issuer|ssoEnforced/);
});

test('custom provider configuration fails closed for malformed identifiers and display names', () => {
  const configured = { ...env, REVIEW_SSO_ENABLED: 'true', REVIEW_SSO_PROVIDER_ID: 'custom:company' };
  for (const id of ['', 'google', 'custom:', 'custom:Uppercase', 'custom:foo?token=secret', 'custom:foo/bar', 'custom:' + 'x'.repeat(44)]) assert.equal(publicReviewConfig({ ...configured, REVIEW_SSO_PROVIDER_ID: id }).ssoProvider, null);
  for (const label of ['', ' ', '<script>', 'line\nbreak', 'x'.repeat(49)]) assert.equal(publicReviewConfig({ ...configured, REVIEW_SSO_DISPLAY_NAME: label }).ssoProvider, null);
  assert.deepEqual(publicReviewConfig(configured).ssoProvider, { id: 'custom:company', label: 'Company SSO' });
});

test('POST authenticates before invoking action and passes the verified user context', async () => {
  const order: string[] = [];
  const result = await call(safeHandler({ authenticate: async (authorization, supplied) => { order.push('authenticate'); assert.match(authorization ?? '', /^Bearer /); assert.equal(supplied, env); return authenticated; }, invoke: async (action, auth, supplied) => { order.push('invoke'); assert.deepEqual(action, { action: 'organizations' }); assert.equal(auth, authenticated); assert.equal(supplied, env); return [{ id: organizationId }]; } }));
  assert.deepEqual(order, ['authenticate', 'invoke']); assert.equal(result.status, 200);
  assert.deepEqual((result.body as { data: unknown }).data, [{ id: organizationId }]);
  assert.match((result.body as { requestId: string }).requestId, /^[a-f0-9-]{36}$/);
  assert.equal(result.headers['Cache-Control'], 'private, no-store'); assert.equal(result.headers.Vary, 'Origin, Authorization');
});

test('invalid session never invokes organization or billable work', async () => {
  let invoked = false;
  const result = await call(safeHandler({ authenticate: async () => { throw new ReviewAccessError(401, 'INVALID_SESSION', 'Sign in again.'); }, invoke: async () => { invoked = true; } }));
  assert.equal(result.status, 401); assert.equal(invoked, false);
  assert.equal((result.body as { code: string }).code, 'INVALID_SESSION');
});

test('real authentication rejects absent sessions before work', async () => {
  let invoked = false;
  const result = await call(createReviewHandler({ env, invoke: async () => { invoked = true; } }), request({ action: 'organizations' }, { authorization: '' }));
  assert.equal(result.status, 401); assert.equal(invoked, false);
});

test('origin checks reject cross-site, opaque, credentialed and malformed origins', async () => {
  for (const origin of ['https://attacker.invalid', 'null', 'https://user:password@sparecycle-topaz.vercel.app', 'https://sparecycle-topaz.vercel.app/path', 'file:///', ['https://sparecycle-topaz.vercel.app']]) {
    let called = false;
    const result = await call(safeHandler({ authenticate: async () => { called = true; return authenticated; } }), request({ action: 'organizations' }, { origin }));
    assert.equal(result.status, 403); assert.equal(called, false);
  }
});

test('authenticated non-browser requests can omit Origin, while cross-site fetch cannot', async () => {
  const req = request(); delete req.headers.origin;
  assert.equal((await call(safeHandler(), req)).status, 200);
  req.headers['sec-fetch-site'] = 'cross-site';
  assert.equal((await call(safeHandler(), req)).status, 403);
});

test('without APP_ORIGIN the exact host must match, including the port', async () => {
  const handler = safeHandler({ env: {} });
  assert.equal((await call(handler, request(null, { host: 'localhost:3000', origin: 'http://localhost:3000' }))).status, 400);
  assert.equal((await call(handler, request({ action: 'organizations' }, { host: 'localhost:3000', origin: 'http://localhost:3000' }))).status, 200);
  assert.equal((await call(handler, request({ action: 'organizations' }, { host: 'localhost:3000', origin: 'http://localhost:3001' }))).status, 403);
});

test('unsupported methods include allowed method information', async () => {
  for (const method of ['PUT', 'DELETE', 'OPTIONS']) { const result = await call(safeHandler(), request(undefined, {}, method)); assert.equal(result.status, 405); assert.equal(result.headers.Allow, 'GET, POST'); }
});

test('non-JSON media types and ambiguous header arrays are rejected', async () => {
  for (const contentType of ['text/plain', 'application/jsonp', ['application/json'], 'application/json; charset=utf-8; surprise=true']) {
    const result = await call(safeHandler(), request({ action: 'organizations' }, { 'content-type': contentType })); assert.equal(result.status, 400);
  }
  assert.equal((await call(safeHandler(), request({ action: 'organizations' }, { 'content-type': 'application/json; charset=utf-8' }))).status, 200);
});

test('malformed, missing, cyclic and oversized JSON is rejected before authentication', async () => {
  const cycle: Record<string, unknown> = {}; cycle.self = cycle;
  for (const body of ['{', undefined, null, 42, ['organizations'], cycle, ' '.repeat(REVIEW_MAX_BODY_BYTES + 1)]) {
    let authenticatedCall = false;
    const req = request(); req.body = body;
    const result = await call(safeHandler({ authenticate: async () => { authenticatedCall = true; return authenticated; } }), req);
    assert.equal(result.status, 400); assert.equal(authenticatedCall, false);
  }
});

test('byte limits account for multibyte text and declared body length', async () => {
  const body = { action: 'addEvidence', organizationId, laptopId: recordId, kind: 'technician_note', source: 'Bench', content: '🔎'.repeat(8200) };
  assert.equal((await call(safeHandler(), request(body))).status, 400);
  assert.equal((await call(safeHandler(), request({ action: 'organizations' }, { 'content-length': '999999' }))).status, 400);
});

test('all public actions have strict schemas and the OpenAPI contract includes them', () => {
  const document = reviewOpenApiDocument();
  assert.equal(Object.keys(reviewActionSchemas).length, 14);
  for (const action of Object.keys(reviewActionSchemas)) assert.ok(action in document.components.schemas);
  assert.equal(document.openapi, '3.1.0');
  assert.equal(reviewActionSchema.safeParse({ action: 'organizations', role: 'owner' }).success, false);
  assert.equal(reviewActionSchema.safeParse({ action: 'completeJob', organizationId, passed: true }).success, false);
});

test('organization and record identifiers must be UUIDs; role escalation fields are rejected', () => {
  assert.equal(reviewActionSchema.safeParse({ action: 'overview', organizationId: '../../other-org' }).success, false);
  assert.equal(reviewActionSchema.safeParse({ action: 'createInvite', organizationId, role: 'owner' }).success, false);
  assert.equal(reviewActionSchema.safeParse({ action: 'createOrganization', name: 'Pilot', role: 'owner' }).success, false);
  assert.equal(reviewActionSchema.safeParse({ action: 'createOrganization', name: '   ' }).success, false);
});

test('project schema bounds test inputs to the exact supported diagnostics surface', () => {
  const valid = { action: 'connectProject', organizationId, repository: 'company/diagnostics', installationId: 123, targetPath: 'src/diagnostics/battery.mjs', testPaths: ['tests/diagnostics/battery.test.mjs'], githubUserToken: 'github_pat_test_only_123456' };
  assert.equal(reviewActionSchema.safeParse(valid).success, true);
  for (const targetPath of ['.env', '.github/workflows/ci.yml', 'src/diagnostics/../../secrets.mjs', 'src/diagnostics/hello.mjs;curl', '/src/diagnostics/battery.mjs']) assert.equal(reviewActionSchema.safeParse({ ...valid, targetPath }).success, false);
  assert.equal(reviewActionSchema.safeParse({ ...valid, testPaths: [] }).success, false);
  assert.equal(reviewActionSchema.safeParse({ ...valid, testPaths: Array(5).fill('tests/diagnostics/battery.test.mjs') }).success, false);
  assert.equal(reviewActionSchema.safeParse({ ...valid, repository: 'https://github.com/company/repo' }).success, false);
  assert.equal(reviewActionSchema.safeParse({ ...valid, installationId: '123' }).success, false);
});

test('approval is bound to evidence version, full commit and full patch hash', () => {
  const valid = { action: 'approveChange', organizationId, changeId: recordId, evidenceVersion: 2, baseCommit: 'a'.repeat(40), patchHash: 'b'.repeat(64) };
  assert.equal(reviewActionSchema.safeParse(valid).success, true);
  for (const extra of [{ evidenceVersion: -1 }, { evidenceVersion: 1.5 }, { baseCommit: 'main' }, { patchHash: 'abc' }, { userId: 'forged-reviewer' }, { testsPassed: true }]) assert.equal(reviewActionSchema.safeParse({ ...valid, ...extra }).success, false);
});

test('job requests require an idempotency UUID and cannot provide model or test outputs', () => {
  const valid = { action: 'runJob', organizationId, changeId: recordId, stage: 'verify', idempotencyKey: recordId };
  assert.equal(reviewActionSchema.safeParse(valid).success, true);
  assert.equal(reviewActionSchema.safeParse({ ...valid, idempotencyKey: 'any-string' }).success, false);
  assert.equal(reviewActionSchema.safeParse({ ...valid, verification: { status: 'passed' } }).success, false);
  assert.equal(reviewActionSchema.safeParse({ ...valid, stage: 'merge' }).success, false);
});

test('safe authorization, database and provider errors preserve status without raw details', async () => {
  for (const error of [new ReviewAccessError(403, 'ACCESS_DENIED', 'Insufficient role.'), new ReviewStoreError(409, 'CONFLICT', 'This record changed.'), new ReviewEngineError('NEBIUS_UNAVAILABLE', 'The model did not complete.', 502)]) {
    const result = await call(safeHandler({ invoke: async () => { throw error; } }));
    assert.equal(result.status, error.status); assert.equal((result.body as { code: string }).code, error.code);
  }
  const unknown = await call(safeHandler({ invoke: async () => { throw new Error('secret-access-token and private repository contents'); } }));
  assert.equal(unknown.status, 500); assert.equal(JSON.stringify(unknown.body).includes('secret-access-token'), false);
});

test('quota rejection provides retry information and budget schema rejects unsafe values', async () => {
  const result = await call(safeHandler({ invoke: async () => { throw new ReviewStoreError(429, 'QUOTA_EXCEEDED', 'Budget reached.'); } }));
  assert.equal(result.status, 429); assert.equal(result.headers['Retry-After'], '60');
  for (const value of [-1, 1.1, 10_001, 1_000_001, Number.POSITIVE_INFINITY, '500']) assert.equal(reviewActionSchema.safeParse({ action: 'setBudget', organizationId, monthlyBudgetCents: value }).success, false);
});
