import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createHmac, generateKeyPairSync } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { snapshotPreimage, candidatePreimage } from '../scripts/review-integrity.mjs';
import { candidateHash, createGitHubClient, sha256, snapshotHash, validateCandidate, validatePublishInput, validateSnapshot, verifyUserRepositoryAccess, verifyWebhookSignature, type CandidatePatch, type PublishInput, type RepositorySnapshot } from '../lib/review/github.js';

function fixture(): { snapshot: RepositorySnapshot; candidate: CandidatePatch; publish: PublishInput } {
  const snapshot: RepositorySnapshot = { repository: { installationId: 12, repositoryId: 34, owner: 'example', name: 'diagnostics', defaultBranch: 'main', isPrivate: false }, baseSha: 'a'.repeat(40), treeSha: 'b'.repeat(40), targetPath: 'src/diagnostics/battery.mjs', files: [
    { path: 'src/diagnostics/battery.mjs', content: 'export function battery(n) { return n * 100; }', blobSha: 'c'.repeat(40), sha256: '' },
    { path: 'tests/diagnostics/battery.test.mjs', content: "import { test } from 'node:test'; test('battery', () => {});", blobSha: 'd'.repeat(40), sha256: '' },
  ], hash: '' };
  snapshot.files.forEach(f => { f.sha256 = sha256(f.content); }); snapshot.hash = snapshotHash(snapshot);
  const candidate: CandidatePatch = { path: snapshot.targetPath, content: 'export function battery(n) { return n / 100; }', rationale: 'Normalize percentage.', risk: 'Narrow parser scope.', baseSha: snapshot.baseSha, snapshotHash: snapshot.hash, evidenceHash: sha256('evidence'), hash: '' }; candidate.hash = candidateHash(candidate);
  return { snapshot, candidate, publish: { snapshot, candidate, changeId: 'rcr-123', title: 'Correct the battery parser', currentEvidenceHash: candidate.evidenceHash, verification: { snapshotHash: snapshot.hash, candidateHash: candidate.hash, evidenceHash: candidate.evidenceHash, imageId: 'image', baselineOperationId: 'baseline', candidateOperationId: 'candidate', baselineFailed: 1, baselinePassed: 2, candidatePassed: 3, candidateFailed: 0, testNamesHash: sha256('test-identities'), networkDisabled: true, completedAt: new Date().toISOString() }, review: { approved: true, reasons: ['Behavior preserved'], candidateHash: candidate.hash, model: 'reviewer' }, approval: { requestedBy: 'writer', approvedBy: 'reviewer', candidateHash: candidate.hash, evidenceHash: candidate.evidenceHash, snapshotHash: snapshot.hash } } };
}
const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const env = { GITHUB_APP_ID: '123', GITHUB_APP_PRIVATE_KEY: keys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() };
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const failCode = (code: string) => (e: unknown) => Boolean(e && typeof e === 'object' && 'code' in e && e.code === code);

test('snapshot and patch bind the exact source, tests, repository and evidence', () => {
  const { snapshot, candidate } = fixture(); validateSnapshot(snapshot); validateCandidate(snapshot, candidate);
  snapshot.files[1].content += '// changed'; assert.throws(() => validateCandidate(snapshot, candidate), failCode('INVALID_SNAPSHOT'));
});

test('API and verifier hashes survive reordered object keys and snapshot file order', () => {
  const { snapshot, candidate } = fixture();
  const reorderKeys = (value: unknown): unknown => Array.isArray(value) ? value.map(reorderKeys) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).reverse().map(([key, item]) => [key, reorderKeys(item)])) : value;
  const restoredSnapshot = reorderKeys(snapshot) as RepositorySnapshot;
  const restoredCandidate = reorderKeys(candidate) as CandidatePatch;
  restoredSnapshot.files.reverse();
  assert.notDeepEqual(Object.keys(restoredSnapshot.repository), Object.keys(snapshot.repository));
  assert.equal(snapshotHash(restoredSnapshot), snapshot.hash);
  assert.equal(candidateHash(restoredCandidate), candidate.hash);
  assert.equal(sha256(snapshotPreimage(restoredSnapshot)), snapshot.hash);
  assert.equal(sha256(candidatePreimage(restoredCandidate)), candidate.hash);
  validateCandidate(restoredSnapshot, restoredCandidate);
});

test('stored checkpoints retain valid snapshot, patch and approval bindings after a PostgreSQL JSONB round trip', async () => {
  const { publish } = fixture(); const db = new PGlite();
  try {
    const result = await db.query<{ checkpoint: PublishInput }>('SELECT $1::jsonb AS checkpoint', [JSON.stringify(publish)]);
    const restored = result.rows[0].checkpoint;
    // This exercises the database representation that differs from ordinary JSON.parse(JSON.stringify(...)).
    assert.notDeepEqual(Object.keys(restored.snapshot.repository), Object.keys(publish.snapshot.repository));
    assert.equal(snapshotHash(restored.snapshot), publish.snapshot.hash);
    assert.equal(candidateHash(restored.candidate), publish.candidate.hash);
    validatePublishInput(restored);
    assert.equal(sha256(snapshotPreimage(restored.snapshot)), publish.snapshot.hash);
    assert.equal(sha256(candidatePreimage(restored.candidate)), publish.candidate.hash);
  } finally { await db.close(); }
});

test('canonical snapshot hashes still bind every approved repository identity field', () => {
  const { snapshot } = fixture();
  for (const changed of [{ installationId: 13 }, { repositoryId: 35 }, { owner: 'other' }, { name: 'other' }, { defaultBranch: 'other' }, { isPrivate: true }]) {
    assert.notEqual(snapshotHash({ ...snapshot, repository: { ...snapshot.repository, ...changed } }), snapshot.hash);
  }
  const missingPrivacy = { ...snapshot, repository: { ...snapshot.repository, isPrivate: undefined } };
  assert.equal(snapshotHash(missingPrivacy), snapshotHash(JSON.parse(JSON.stringify(missingPrivacy))));
  assert.notEqual(snapshotHash(missingPrivacy), snapshot.hash);
});
test('test edits, traversal, protected files, oversized sources and unchanged patches fail closed', () => {
  const { snapshot, candidate } = fixture();
  for (const path of ['tests/diagnostics/battery.test.mjs', '.github/workflows/test.yml', 'src/diagnostics/../x.mjs']) {
    const changed = { ...candidate, path }; changed.hash = candidateHash(changed); assert.throws(() => validateCandidate(snapshot, changed), failCode('INVALID_PATCH'));
  }
  for (const content of [snapshot.files[0].content, 'x'.repeat(32_001)]) {
    const changed = { ...candidate, content }; changed.hash = candidateHash(changed); assert.throws(() => validateCandidate(snapshot, changed), failCode('INVALID_PATCH'));
  }
});
test('narrow parser profile rejects process, network, imports and dynamic execution', () => {
  const { snapshot, candidate } = fixture();
  for (const content of ['process.exit(0)', 'import fs from "node:fs"', 'fetch("https://exfil.test")', 'globalThis.x = 1', 'eval("anything")', '({}).constructor.constructor("return 0")()']) {
    const changed = { ...candidate, content }; changed.hash = candidateHash(changed); assert.throws(() => validateCandidate(snapshot, changed), failCode('UNSAFE_PATCH'));
  }
});
test('publication requires matching tests, independent approval and current evidence', () => {
  const { publish } = fixture(); validatePublishInput(publish);
  assert.throws(() => validatePublishInput({ ...publish, currentEvidenceHash: sha256('new evidence') }), failCode('VERIFICATION_REQUIRED'));
  assert.throws(() => validatePublishInput({ ...publish, verification: { ...publish.verification, candidatePassed: 2 } }), failCode('VERIFICATION_REQUIRED'));
  assert.throws(() => validatePublishInput({ ...publish, approval: { ...publish.approval, approvedBy: 'writer' } }), failCode('APPROVAL_REQUIRED'));
  assert.throws(() => validatePublishInput({ ...publish, review: { ...publish.review, approved: false } }), failCode('APPROVAL_REQUIRED'));
});
test('webhook signature uses exact raw bytes and rejects malformed signatures', () => {
  const body = Buffer.from('{"event":"pull_request"}'); const secret = 'webhook-secret';
  const signature = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
  assert.equal(verifyWebhookSignature(body, signature, secret), true);
  assert.equal(verifyWebhookSignature(Buffer.from('{}'), signature, secret), false);
  assert.equal(verifyWebhookSignature(body, 'sha256=short', secret), false);
  assert.equal(verifyWebhookSignature(body, signature, ''), false);
});
test('linking checks the actual GitHub App user and rejects read-only membership', async () => {
  const { snapshot } = fixture();
  const mock = (write: boolean): typeof fetch => async (url, init) => {
    assert.equal(String(url), 'https://api.github.com/repos/example/diagnostics');
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer actor-token');
    return response({ id: 34, full_name: 'example/diagnostics', permissions: { push: write } });
  };
  await verifyUserRepositoryAccess('actor-token', snapshot.repository, { fetch: mock(true) });
  await assert.rejects(verifyUserRepositoryAccess('actor-token', snapshot.repository, { fetch: mock(false) }), failCode('GITHUB_REPOSITORY_FORBIDDEN'));
});
test('repository reads use short-lived token narrowed to one installation repository', async () => {
  const { snapshot } = fixture(); const seen: string[] = [];
  const fetcher: typeof fetch = async (url, init) => {
    const path = new URL(String(url)).pathname; seen.push(path);
    if (path.endsWith('/access_tokens')) { assert.deepEqual(JSON.parse(String(init?.body)), { repository_ids: [34], permissions: { contents: 'read' } }); return response({ token: 'temporary-installation-token', expires_at: new Date(Date.now() + 60_000).toISOString() }); }
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer temporary-installation-token');
    if (path === '/repos/example/diagnostics') return response({ id: 34, full_name: 'example/diagnostics', default_branch: 'main', private: false });
    if (path.includes('/git/ref/')) return response({ object: { sha: snapshot.baseSha, type: 'commit' } });
    if (path.includes('/git/commits/')) return response({ tree: { sha: snapshot.treeSha } });
    if (path.includes('/git/trees/')) return response({ truncated: false, tree: snapshot.files.map(f => ({ path: f.path, type: 'blob', mode: '100644', sha: f.blobSha })) });
    const file = snapshot.files.find(f => path.endsWith('/contents/' + f.path)); assert.ok(file);
    assert.equal(new URL(String(url)).searchParams.get('ref'), snapshot.baseSha);
    return response({ type: 'file', encoding: 'base64', size: Buffer.byteLength(file.content), sha: file.blobSha, content: Buffer.from(file.content).toString('base64') });
  };
  const read = await createGitHubClient(env, { fetch: fetcher }).readSnapshot(snapshot.repository, snapshot.targetPath, [snapshot.files[1].path]);
  assert.equal(read.hash, snapshot.hash); assert.equal(seen.length, 7);
});
test('stale base prevents all repository writes', async () => {
  const { publish } = fixture(); const writes: string[] = [];
  const fetcher: typeof fetch = async (url, init) => {
    const path = new URL(String(url)).pathname;
    if (path.endsWith('/access_tokens')) return response({ token: 'temporary', expires_at: new Date(Date.now() + 60_000).toISOString() });
    if (init?.method === 'POST') writes.push(path);
    if (path === '/repos/example/diagnostics') return response({ id: 34, full_name: 'example/diagnostics', default_branch: 'main' });
    return response({ object: { sha: 'e'.repeat(40), type: 'commit' } });
  };
  await assert.rejects(createGitHubClient(env, { fetch: fetcher }).publishDraft(publish), failCode('STALE_HEAD')); assert.deepEqual(writes, []);
});
test('publisher creates exactly one changed blob and a draft PR; never merges', async () => {
  const { publish } = fixture(); const writes: Array<{ path: string; body: any }> = [];
  publish.title = 'PRIVATE_ASSET_CASE_TITLE'; publish.candidate.rationale = 'PRIVATE_TECHNICIAN_NOTE'; publish.candidate.risk = 'PRIVATE_OWNER_DETAILS';
  const fetcher: typeof fetch = async (url, init) => {
    const path = new URL(String(url)).pathname; const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    if (path.endsWith('/access_tokens')) { assert.deepEqual(body.permissions, { contents: 'write', pull_requests: 'write' }); return response({ token: 'temporary', expires_at: new Date(Date.now() + 60_000).toISOString() }); }
    if (path === '/repos/example/diagnostics') return response({ id: 34, full_name: 'example/diagnostics', default_branch: 'main' });
    if (path.includes('/git/ref/heads/sparecycle/')) return response({ message: 'Not Found' }, 404);
    if (path.includes('/git/ref/')) return response({ object: { sha: publish.snapshot.baseSha, type: 'commit' } });
    if (init?.method === 'GET' && path.endsWith('/pulls')) return response([]);
    writes.push({ path, body });
    if (path.endsWith('/pulls')) return response({ draft: true, number: 7, html_url: 'https://github.com/example/diagnostics/pull/7' });
    return response({ sha: 'f'.repeat(40) });
  };
  const result = await createGitHubClient(env, { fetch: fetcher }).publishDraft(publish);
  assert.equal(result.number, 7); assert.equal(writes.length, 5);
  assert.equal(writes.find(w => w.path.endsWith('/git/trees'))?.body.tree.length, 1);
  assert.equal(writes.find(w => w.path.endsWith('/git/trees'))?.body.tree[0].path, publish.candidate.path);
  assert.equal(writes.at(-1)?.body.draft, true); assert.equal(writes.at(-1)?.body.maintainer_can_modify, false);
  assert.equal(writes.some(w => w.path.includes('/merge')), false);
  const publicWrites = JSON.stringify(writes);
  for (const privateValue of [publish.title, publish.candidate.rationale, publish.candidate.risk]) assert.equal(publicWrites.includes(privateValue), false);
  assert.equal(writes.at(-1)?.body.title, '[SpareCycle] Fix diagnostic parser battery.mjs');
});
test('AST parser policy rejects computed and escaped constructor access and ambient capabilities', () => {
  const { snapshot, candidate } = fixture();
  const bypasses = [
    "const g = (()=>{})['con'+'structor']('return this')(); g['pro'+'cess']['ex'+'it'](0); export const parse = value => Number(value);",
    "export const parse = x => x['constructor'];",
    "export const parse = x => x['con\\u0073tructor'];",
    "export const parse = x => { const key = 'constructor'; return x[key]; };",
    "export const parse = x => { const { constructor: f } = x; return f(); };",
    'export const parse = x => this;',
    'export const parse = x => glob\\u0061lThis;',
    'export const parse = x => setTimeout(() => {}, 1);',
    'export const parse = x => { const f = Number.parseInt.bind; return f(x); };',
    'export const parse = x => { Number.isFinite = () => true; return x; };',
    'export function parse(x) { for (Math.max of [() => 0]) {} return x; }',
    'export const parse = async x => await x;',
    'export const parse = x => new Proxy(x, {});',
  ];
  for (const content of bypasses) {
    const changed = { ...candidate, content }; changed.hash = candidateHash(changed);
    assert.throws(() => validateCandidate(snapshot, changed), failCode('UNSAFE_PATCH'), content);
  }
});
test('AST parser policy accepts useful pure diagnostic parsing with literal indexes and local scopes', () => {
  const { snapshot, candidate } = fixture();
  const content = `const pattern = /([0-9.]+) mWh/;
export function battery(input) {
 const text = String(input).trim();
 const match = pattern.exec(text);
 if (!match) return null;
 const capacity = Number(match[1]);
 if (!Number.isFinite(capacity)) throw new Error('Invalid capacity');
 let total = 0;
 for (const n of [1, 2]) { total += n; }
 return { capacityWh: capacity / 1000, note: 'process is plain text', samples: total };
}`;
  const changed = { ...candidate, content }; changed.hash = candidateHash(changed); validateCandidate(snapshot, changed);
});
test('uncertain write outcomes are not silently retried', async () => {
  const { snapshot } = fixture(); let calls = 0;
  const fetcher: typeof fetch = async () => { calls += 1; throw new Error('secret-bearing provider error'); };
  await assert.rejects(createGitHubClient(env, { fetch: fetcher }).readSnapshot(snapshot.repository, snapshot.targetPath, [snapshot.files[1].path]), failCode('GITHUB_WRITE_UNCERTAIN'));
  assert.equal(calls, 1);
});
test('publication recovers an exact existing branch and never overwrites a conflict', async () => {
  const { publish } = fixture(); const posted: string[] = []; let conflict = false;
  const expectedBlob = createHash('sha1').update(`blob ${Buffer.byteLength(publish.candidate.content)}\0`).update(publish.candidate.content).digest('hex');
  const fetcher: typeof fetch = async (url, init) => {
    const path = new URL(String(url)).pathname;
    if (path.endsWith('/access_tokens')) return response({ token: 'temporary', expires_at: new Date(Date.now() + 60_000).toISOString() });
    if (path === '/repos/example/diagnostics') return response({ id: 34, full_name: 'example/diagnostics', default_branch: 'main' });
    if (path.endsWith('/git/ref/heads/main')) return response({ object: { sha: publish.snapshot.baseSha, type: 'commit' } });
    if (path.includes('/git/ref/heads/sparecycle/')) return response({ object: { sha: 'f'.repeat(40), type: 'commit' } });
    if (path.includes('/compare/')) return response({ status: 'ahead', total_commits: 1, files: [{ filename: publish.candidate.path, status: 'modified', sha: conflict ? '0'.repeat(40) : expectedBlob }] });
    if (path.includes('/git/commits/')) return response({ parents: [{ sha: publish.snapshot.baseSha }], tree: { sha: 'e'.repeat(40) } });
    if (path.includes('/git/trees/')) return response({ tree: [{ path: publish.candidate.path, type: 'blob', mode: '100644', sha: expectedBlob }], truncated: false });
    if (init?.method === 'GET' && path.endsWith('/pulls')) return response([]);
    posted.push(path); return response({ draft: true, number: 7, html_url: 'https://github.com/example/diagnostics/pull/7' });
  };
  const result = await createGitHubClient(env, { fetch: fetcher }).publishDraft(publish);
  assert.equal(result.commitSha, 'f'.repeat(40)); assert.deepEqual(posted, ['/repos/example/diagnostics/pulls']);
  conflict = true; posted.length = 0;
  await assert.rejects(createGitHubClient(env, { fetch: fetcher }).publishDraft(publish), failCode('PUBLICATION_CONFLICT')); assert.deepEqual(posted, []);
});
