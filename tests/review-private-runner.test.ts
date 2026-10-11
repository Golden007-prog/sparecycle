import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { zipSync, strToU8 } from 'fflate';
import { createActionsRunner, privateRunnerConfigured, resolvePrivateRunner, type ActionsReceipt } from '../lib/review/actions-runner.js';
import { candidateHash, createGitHubClient, sha256, snapshotHash, validatePublishInput, type CandidatePatch, type PublishInput, type RepositorySnapshot } from '../lib/review/github.js';
import { openPrivatePayload, privateKeyFingerprint, sealPrivatePayload, type PrivatePayloadContext } from '../scripts/review-private-payload.mjs';

const org = '11111111-1111-4111-8111-111111111111';
const otherOrg = '22222222-2222-4222-8222-222222222222';
const keys = generateKeyPairSync('rsa', { modulusLength: 3072 });
const publicKeyPem = keys.publicKey.export({ type: 'spki', format: 'pem' }).toString();
const privateKeyPem = keys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const binding = { organizationId: org, repository: 'customer/diagnostics', repositoryId: 2, installationId: 3, ref: 'review-verifier-v2', sha: 'e'.repeat(40), image: `node:22-alpine@sha256:${'f'.repeat(64)}`, publicKeyPem };
const env = { GITHUB_APP_ID: '123', GITHUB_APP_PRIVATE_KEY: privateKeyPem, REVIEW_PRIVATE_RUNNERS_JSON: JSON.stringify([binding]) };
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const code = (value: string) => (error: unknown) => Boolean(error && typeof error === 'object' && 'code' in error && error.code === value);
function fixture() {
  const snapshot: RepositorySnapshot = { repository: { owner: 'customer', name: 'diagnostics', repositoryId: 2, installationId: 3, defaultBranch: 'main', isPrivate: true }, baseSha: 'a'.repeat(40), treeSha: 'b'.repeat(40), targetPath: 'src/diagnostics/battery.mjs', files: [
    { path: 'src/diagnostics/battery.mjs', content: 'export function battery(n) { return n * 100; } // PRIVATE_SOURCE_SENTINEL', sha256: '', blobSha: 'c'.repeat(40) },
    { path: 'tests/diagnostics/battery.test.mjs', content: '// PRIVATE_TEST_SENTINEL\nimport { test } from "node:test"; test("battery", () => {});', sha256: '', blobSha: 'd'.repeat(40) },
  ], hash: '' };
  snapshot.files.forEach(file => { file.sha256 = sha256(file.content); }); snapshot.hash = snapshotHash(snapshot);
  const candidate: CandidatePatch = { path: snapshot.targetPath, content: 'export function battery(n) { return n / 100; }', rationale: 'PRIVATE_MODEL_RATIONALE', risk: 'PRIVATE_RISK', baseSha: snapshot.baseSha, snapshotHash: snapshot.hash, evidenceHash: sha256('PRIVATE_LAPTOP_EVIDENCE'), hash: '' }; candidate.hash = candidateHash(candidate);
  return { snapshot, candidate };
}
function context(): PrivatePayloadContext {
  const config = resolvePrivateRunner(env, org, fixture().snapshot.repository);
  return { version: 1, organizationId: org, repository: binding.repository, repositoryId: 2, installationId: 3, runnerSha: binding.sha, bindingHash: config.bindingHash, keyFingerprint: config.keyFingerprint, nonce: '1'.repeat(32) };
}
const expected = () => ({ repository: binding.repository, repositoryId: 2, runnerSha: binding.sha, nonce: '1'.repeat(32) });

test('private dispatch encryption authenticates every context field without exposing source', () => {
  const source = JSON.stringify({ source: 'PRIVATE_SOURCE_SENTINEL', tests: 'PRIVATE_TEST_SENTINEL' });
  const sealed = sealPrivatePayload(source, publicKeyPem, context());
  assert.equal(sealed.includes('PRIVATE_SOURCE_SENTINEL'), false);
  assert.equal(sealed.includes(Buffer.from(source).toString('base64')), false);
  assert.equal(openPrivatePayload(sealed, privateKeyPem, expected()).plaintext, source);
  assert.notEqual(sealPrivatePayload(source, publicKeyPem, context()), sealed);
  for (const property of ['organizationId', 'repository', 'repositoryId', 'installationId', 'runnerSha', 'bindingHash', 'keyFingerprint', 'nonce']) {
    const changed = JSON.parse(sealed); const original = changed.context[property];
    changed.context[property] = typeof original === 'number' ? 999 : (String(original)[0] === '9' ? '8' : '9') + String(original).slice(1);
    assert.notEqual(changed.context[property], original, `The tampered ${property} must actually change.`);
    assert.throws(() => openPrivatePayload(JSON.stringify(changed), privateKeyPem, expected()), /private verification envelope/);
  }
  for (const property of ['wrappedKey', 'iv', 'tag', 'ciphertext']) {
    const changed = JSON.parse(sealed); changed[property] = (changed[property][0] === 'A' ? 'B' : 'A') + changed[property].slice(1);
    assert.throws(() => openPrivatePayload(JSON.stringify(changed), privateKeyPem, expected()));
  }
  for (const changed of [{ repository: 'other/diagnostics' }, { repositoryId: 99 }, { runnerSha: 'a'.repeat(40) }, { nonce: '2'.repeat(32) }]) assert.throws(() => openPrivatePayload(sealed, privateKeyPem, { ...expected(), ...changed }));
});

test('private transport fails closed for weak keys, wrong keys, malformed envelopes and oversized input', () => {
  const weak = generateKeyPairSync('rsa', { modulusLength: 2048 });
  assert.throws(() => privateKeyFingerprint(weak.publicKey.export({ type: 'spki', format: 'pem' }).toString()));
  assert.throws(() => sealPrivatePayload('x'.repeat(42_001), publicKeyPem, context()));
  assert.throws(() => openPrivatePayload('x'.repeat(60_001), privateKeyPem, expected()));
  const sealed = sealPrivatePayload('PRIVATE_SOURCE_SENTINEL', publicKeyPem, context());
  assert.throws(() => openPrivatePayload(sealed, weak.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(), expected()));
  assert.throws(() => openPrivatePayload(JSON.stringify({ ...JSON.parse(sealed), extra: 'unexpected' }), privateKeyPem, expected()));
  assert.throws(() => openPrivatePayload('{PRIVATE_SOURCE_SENTINEL', privateKeyPem, expected()), error => !String(error).includes('PRIVATE_SOURCE_SENTINEL'));
});

test('private configuration requires exact organization, repository, installation and public-key bindings', () => {
  const { snapshot } = fixture();
  assert.equal(privateRunnerConfigured(env), true); assert.equal(privateRunnerConfigured({}), false);
  assert.equal(privateRunnerConfigured({ ...env, REVIEW_PRIVATE_RUNNERS_JSON: 'invalid' }), false);
  assert.throws(() => resolvePrivateRunner(env, otherOrg, snapshot.repository), code('PRIVATE_RUNNER_REQUIRED'));
  assert.throws(() => resolvePrivateRunner(env, org, { ...snapshot.repository, installationId: 4 }), code('PRIVATE_RUNNER_REQUIRED'));
  assert.throws(() => resolvePrivateRunner(env, org, { ...snapshot.repository, name: 'other' }), code('PRIVATE_RUNNER_REQUIRED'));
  assert.throws(() => resolvePrivateRunner({ ...env, REVIEW_PRIVATE_RUNNERS_JSON: JSON.stringify([binding, binding]) }, org, snapshot.repository), code('PRIVATE_RUNNER_CONFIG_INVALID'));
  assert.throws(() => resolvePrivateRunner({ ...env, REVIEW_PRIVATE_RUNNERS_JSON: JSON.stringify([{ ...binding, publicKeyPem: privateKeyPem }]) }, org, snapshot.repository), code('PRIVATE_RUNNER_CONFIG_INVALID'));
  const reordered = Object.fromEntries(Object.entries(binding).reverse());
  assert.equal(resolvePrivateRunner({ ...env, REVIEW_PRIVATE_RUNNERS_JSON: JSON.stringify([reordered]) }, org, snapshot.repository).bindingHash, resolvePrivateRunner(env, org, snapshot.repository).bindingHash);
});

function privateTransport(options: { private?: boolean; sha?: string } = {}) {
  const calls: Array<{ path: string; body: any }> = [];
  const fetcher: typeof fetch = async (url, init) => {
    const path = new URL(String(url)).pathname; const body = init?.body ? JSON.parse(String(init.body)) : undefined; calls.push({ path, body });
    if (path.endsWith('/access_tokens')) { assert.match(path, /\/installations\/3\//); assert.deepEqual(body.repository_ids, [2]); assert.equal(body.permissions.contents, 'read'); return response({ token: 'temporary-private-token', expires_at: new Date(Date.now() + 60_000).toISOString() }); }
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer temporary-private-token');
    assert.match(path, /^\/repos\/customer\/diagnostics(?:\/|$)/);
    if (path === '/repos/customer/diagnostics') return response({ id: 2, full_name: binding.repository, private: options.private ?? true });
    if (path.includes('/commits/')) return response({ sha: options.sha ?? binding.sha });
    if (path.endsWith('/review-private-verify.yml')) return response({ id: 5, path: '.github/workflows/review-private-verify.yml', state: 'active' });
    assert.ok(path.endsWith('/review-private-verify.yml/dispatches')); return response({ workflow_run_id: 6 });
  };
  return { fetcher, calls };
}

test('private source dispatch stays in its own private repository and transmits authenticated ciphertext only', async () => {
  const { snapshot, candidate } = fixture(); const { fetcher, calls } = privateTransport();
  const receipt = await createActionsRunner(env, { fetch: fetcher }).startActionsVerification(snapshot, candidate, candidate.evidenceHash, { organizationId: org });
  const dispatch = calls.find(call => call.path.endsWith('/dispatches'))!;
  assert.deepEqual(Object.keys(dispatch.body.inputs).sort(), ['envelope', 'nonce']);
  const serialized = JSON.stringify(dispatch.body);
  for (const secret of ['PRIVATE_SOURCE_SENTINEL', 'PRIVATE_TEST_SENTINEL', candidate.rationale, candidate.risk, 'PRIVATE_LAPTOP_EVIDENCE', privateKeyPem]) assert.equal(serialized.includes(secret), false);
  const opened = openPrivatePayload(dispatch.body.inputs.envelope, privateKeyPem, { ...expected(), nonce: receipt.nonce });
  const payload = JSON.parse(opened.plaintext);
  assert.equal(payload.snapshot.files[0].content, snapshot.files[0].content); assert.equal(payload.candidate.content, candidate.content);
  assert.equal(payload.candidate.rationale, ''); assert.equal(payload.candidate.risk, '');
  assert.equal(receipt.executionScope, 'private-repository'); assert.equal(receipt.organizationId, org); assert.equal(receipt.runnerRepositoryId, 2); assert.equal(receipt.runnerInstallationId, 3);
  assert.equal(receipt.payloadHash, sha256(opened.plaintext)); assert.equal(receipt.envelopeHash, sha256(dispatch.body.inputs.envelope));
});

test('wrong tenant, private-to-public visibility changes and moved pins prevent every private dispatch', async () => {
  const { snapshot, candidate } = fixture(); let called = false;
  await assert.rejects(createActionsRunner(env, { fetch: async () => { called = true; return response({}); } }).startActionsVerification(snapshot, candidate, candidate.evidenceHash, { organizationId: otherOrg }), code('PRIVATE_RUNNER_REQUIRED'));
  assert.equal(called, false);
  for (const change of [{ private: false }, { sha: 'a'.repeat(40) }]) {
    const { fetcher, calls } = privateTransport(change);
    await assert.rejects(createActionsRunner(env, { fetch: fetcher }).startActionsVerification(snapshot, candidate, candidate.evidenceHash, { organizationId: org }));
    assert.equal(calls.some(call => call.path.endsWith('/dispatches')), false);
  }
});

function receiptProof() {
  const { snapshot, candidate } = fixture(); const config = resolvePrivateRunner(env, org, snapshot.repository);
  const receipt: ActionsReceipt = { provider: 'GitHub Actions isolated container', runId: 6, runnerRepository: binding.repository, runnerRepositoryId: 2, runnerSha: binding.sha, workflowId: 5, nonce: '1'.repeat(32), payloadHash: '2'.repeat(64), snapshotHash: snapshot.hash, candidateHash: candidate.hash, evidenceHash: candidate.evidenceHash, imageId: binding.image, startedAt: new Date().toISOString(), executionScope: 'private-repository', organizationId: org, runnerInstallationId: 3, bindingHash: config.bindingHash, envelopeHash: '3'.repeat(64), keyFingerprint: config.keyFingerprint };
  const proof = { version: 1, nonce: receipt.nonce, payloadHash: receipt.payloadHash, runnerSha: receipt.runnerSha, runId: receipt.runId, snapshotHash: receipt.snapshotHash, candidateHash: receipt.candidateHash, evidenceHash: receipt.evidenceHash, imageId: receipt.imageId, baselineOperationId: 'github-actions:6:baseline', candidateOperationId: 'github-actions:6:candidate', baselineFailed: 1, baselinePassed: 2, candidatePassed: 3, candidateFailed: 0, testNamesHash: sha256('tests'), networkDisabled: true as const, baselineOutputHash: 'a'.repeat(64), candidateOutputHash: 'b'.repeat(64), completedAt: new Date().toISOString(), executionScope: 'private-repository' as const, runnerRepositoryId: 2, runnerInstallationId: 3, bindingHash: receipt.bindingHash, envelopeHash: receipt.envelopeHash };
  return { snapshot, candidate, receipt, proof };
}

function pollTransport(proof: unknown, privateRepo = true) {
  return (async (url, init) => {
    const path = new URL(String(url)).pathname;
    if (path.endsWith('/access_tokens')) { const body = JSON.parse(String(init?.body)); assert.deepEqual(body, { repository_ids: [2], permissions: { actions: 'read', contents: 'read' } }); return response({ token: 'temporary', expires_at: new Date(Date.now() + 60_000).toISOString() }); }
    if (path === '/repos/customer/diagnostics') return response({ id: 2, full_name: binding.repository, private: privateRepo });
    if (path.endsWith('/actions/runs/6')) return response({ id: 6, repository: { id: 2 }, head_sha: binding.sha, workflow_id: 5, path: '.github/workflows/review-private-verify.yml', event: 'workflow_dispatch', display_title: `SpareCycle verification ${'1'.repeat(32)}`, run_attempt: 1, status: 'completed', conclusion: 'success' });
    if (path.endsWith('/artifacts')) return response({ artifacts: [{ id: 7, name: `sparecycle-proof-${'1'.repeat(32)}`, size_in_bytes: 2000, expired: false }] });
    return new Response(zipSync({ 'proof.json': strToU8(JSON.stringify(proof)) }));
  }) as typeof fetch;
}

test('private proof polling enforces tenant, current visibility, encryption identity and source installation', async () => {
  const { receipt, proof } = receiptProof();
  const result = await createActionsRunner(env, { fetch: pollTransport(proof) }).pollActionsVerification(receipt, { organizationId: org });
  assert.equal(result.status, 'passed'); if (result.status === 'passed') assert.equal(result.proof.executionScope, 'private-repository');
  await assert.rejects(createActionsRunner(env, { fetch: pollTransport(proof) }).pollActionsVerification(receipt, { organizationId: otherOrg }), code('PRIVATE_RUNNER_SCOPE'));
  await assert.rejects(createActionsRunner(env, { fetch: pollTransport(proof, false) }).pollActionsVerification(receipt, { organizationId: org }), code('PRIVATE_RUNNER_SCOPE'));
  for (const changed of [{ envelopeHash: '0'.repeat(64) }, { bindingHash: '0'.repeat(64) }, { runnerRepositoryId: 99 }, { runnerInstallationId: 99 }, { executionScope: undefined }]) {
    await assert.rejects(createActionsRunner(env, { fetch: pollTransport({ ...proof, ...changed }) }).pollActionsVerification(receipt, { organizationId: org }), code('RUNNER_PROOF_INVALID'));
  }
});

test('private draft publication rejects public/shared proof even when all content hashes match', () => {
  const { snapshot, candidate, proof } = receiptProof();
  const publish: PublishInput = { snapshot, candidate, verification: { ...proof, provider: 'GitHub Actions isolated container' }, review: { approved: true, reasons: ['Tested'], candidateHash: candidate.hash, model: 'reviewer' }, approval: { approvedBy: 'reviewer', requestedBy: 'writer', candidateHash: candidate.hash, evidenceHash: candidate.evidenceHash, snapshotHash: snapshot.hash }, changeId: 'test-private', title: 'Private issue', currentEvidenceHash: candidate.evidenceHash };
  validatePublishInput(publish);
  assert.throws(() => validatePublishInput({ ...publish, verification: { ...publish.verification, executionScope: undefined } }), code('PRIVATE_VERIFICATION_REQUIRED'));
  assert.throws(() => validatePublishInput({ ...publish, verification: { ...publish.verification, runnerInstallationId: 99 } }), code('PRIVATE_VERIFICATION_REQUIRED'));
});

test('private workflow passes ciphertext and a masked repository secret, never plaintext source', () => {
  const workflow = readFileSync('.github/workflows/review-private-verify.yml', 'utf8');
  assert.match(workflow, /github\.event\.repository\.private == true/); assert.match(workflow, /REVIEW_ENCRYPTED_PAYLOAD: \$\{\{ inputs\.envelope \}\}/);
  assert.match(workflow, /SPARECYCLE_REVIEW_PRIVATE_KEY: \$\{\{ secrets\.SPARECYCLE_REVIEW_PRIVATE_KEY \}\}/);
  assert.doesNotMatch(workflow, /REVIEW_PAYLOAD:|inputs\.payload|persist-credentials: true/);
  assert.match(workflow, /retention-days: 1/);
  // Exercise only the trusted preflight, without Docker or repository code, and ensure a private-looking error is suppressed.
  const executed = spawnSync(process.execPath, ['scripts/review-verify.mjs'], { encoding: 'utf8', timeout: 10_000, env: { PATH: process.env.PATH, SPARECYCLE_ACORN_ROOT: process.cwd(), REVIEW_EXECUTION_SCOPE: 'private-repository', REVIEW_ENCRYPTED_PAYLOAD: 'PRIVATE_SOURCE_SENTINEL', SPARECYCLE_REVIEW_PRIVATE_KEY: privateKeyPem } });
  assert.equal(executed.status, 1); assert.equal((executed.stdout + executed.stderr).includes('PRIVATE_SOURCE_SENTINEL'), false); assert.equal((executed.stdout + executed.stderr).includes(privateKeyPem), false);
  assert.match(executed.stderr, /Verification failed/);
});

test('private runner suppresses errors after actual decryption and rejects altered GitHub execution identity', () => {
  const directory = mkdtempSync(join(tmpdir(), 'sparecycle-private-preflight-'));
  const eventPath = join(directory, 'event.json');
  try {
    writeFileSync(eventPath, JSON.stringify({ repository: { id: 2, full_name: binding.repository, private: true } }));
    // This reaches the JSON parser after successful RSA/AES decryption. Its parse error contains
    // the sentinel on runtimes with contextual JSON errors; the trusted entry point must hide it.
    const envelope = sealPrivatePayload('{"source": PRIVATE_DECRYPTED_SENTINEL', publicKeyPem, context());
    const runnerEnvironment = {
      PATH: process.env.PATH, SPARECYCLE_ACORN_ROOT: process.cwd(),
      REVIEW_EXECUTION_SCOPE: 'private-repository', REVIEW_ENCRYPTED_PAYLOAD: envelope,
      SPARECYCLE_REVIEW_PRIVATE_KEY: privateKeyPem, REVIEW_NONCE: expected().nonce,
      GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_EVENT_PATH: eventPath,
      GITHUB_RUN_ATTEMPT: '1', RUNNER_ENVIRONMENT: 'github-hosted',
      GITHUB_SHA: binding.sha, GITHUB_WORKFLOW_SHA: binding.sha,
      GITHUB_REPOSITORY: binding.repository, GITHUB_REPOSITORY_ID: '2', GITHUB_RUN_ID: '6',
    };
    for (const mutation of [{}, { GITHUB_WORKFLOW_SHA: 'a'.repeat(40) }, { RUNNER_ENVIRONMENT: 'self-hosted' }, { GITHUB_RUN_ATTEMPT: '2' }, { GITHUB_REPOSITORY_ID: '99' }]) {
      const executed = spawnSync(process.execPath, ['scripts/review-verify.mjs'], { encoding: 'utf8', timeout: 10_000, env: { ...runnerEnvironment, ...mutation } });
      assert.equal(executed.status, 1);
      assert.equal(executed.stdout, '');
      assert.equal(executed.stderr.trim(), 'Verification failed. No source, decrypted payload, test output, or credentials were logged.');
      for (const secret of ['PRIVATE_DECRYPTED_SENTINEL', envelope, privateKeyPem]) assert.equal((executed.stdout + executed.stderr).includes(secret), false);
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('private GitHub connection independently checks actor write access and the exact installation repository', async () => {
  const { snapshot } = fixture();
  for (const changed of [{}, { private: false }, { id: 99 }, { full_name: 'other/diagnostics' }, { archived: true }]) {
    let calls = 0;
    const fetcher: typeof fetch = async (url, init) => {
      const path = new URL(String(url)).pathname; calls++;
      if (calls === 1) {
        assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer one-time-actor-token');
        return response({ id: 2, owner: { login: 'customer' }, name: 'diagnostics', default_branch: 'main', private: true, permissions: { push: true } });
      }
      if (path.endsWith('/access_tokens')) {
        assert.deepEqual(JSON.parse(String(init?.body)), { repository_ids: [2], permissions: { contents: 'read' } });
        return response({ token: 'scoped-private-token', expires_at: new Date(Date.now() + 60_000).toISOString() });
      }
      assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer scoped-private-token');
      return response({ id: 2, full_name: binding.repository, default_branch: 'main', private: true, ...changed });
    };
    const discovering = createGitHubClient(env, { fetch: fetcher }).discoverRepository(3, binding.repository, 'one-time-actor-token');
    if (Object.keys(changed).length) await assert.rejects(discovering, code('REPOSITORY_CHANGED'));
    else assert.deepEqual(await discovering, snapshot.repository);
    assert.equal(calls, 3);
  }
});

test('private publication checks visibility again before writing source and before creating its draft', async () => {
  const { snapshot, candidate, proof } = receiptProof();
  const publish: PublishInput = { snapshot, candidate, verification: { ...proof, provider: 'GitHub Actions isolated container' }, review: { approved: true, reasons: ['Tested'], candidateHash: candidate.hash, model: 'reviewer' }, approval: { approvedBy: 'reviewer', requestedBy: 'writer', candidateHash: candidate.hash, evidenceHash: candidate.evidenceHash, snapshotHash: snapshot.hash }, changeId: 'test-private', title: 'Private issue', currentEvidenceHash: candidate.evidenceHash };
  for (const makePublicAt of [0, 1, 2, 3]) {
    let visibilityChecks = 0; const writes: Array<{ path: string; body: any }> = [];
    const fetcher: typeof fetch = async (url, init) => {
      const path = new URL(String(url)).pathname;
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      if (path.endsWith('/access_tokens')) {
        assert.deepEqual(body, { repository_ids: [2], permissions: { contents: 'write', pull_requests: 'write' } });
        return response({ token: 'scoped-private-token', expires_at: new Date(Date.now() + 60_000).toISOString() });
      }
      assert.match(path, /^\/repos\/customer\/diagnostics(?:\/|$)/);
      if (path === '/repos/customer/diagnostics') return response({ id: 2, full_name: binding.repository, default_branch: 'main', private: ++visibilityChecks !== makePublicAt });
      if (path.includes('/git/ref/heads/sparecycle/')) return response({}, 404);
      if (path.includes('/git/ref/heads/main')) return response({ object: { sha: snapshot.baseSha, type: 'commit' } });
      if (path.endsWith('/pulls') && init?.method === 'GET') return response([]);
      writes.push({ path, body });
      if (path.endsWith('/pulls')) return response({ draft: true, number: 1, html_url: 'https://github.com/customer/diagnostics/pull/1' });
      return response({ sha: 'f'.repeat(40) });
    };
    const publishing = createGitHubClient(env, { fetch: fetcher }).publishDraft(publish);
    if (makePublicAt) {
      await assert.rejects(publishing, code('REPOSITORY_CHANGED'));
      assert.equal(writes.some(write => write.path.endsWith('/pulls')), false);
      if (makePublicAt <= 2) assert.deepEqual(writes, []);
    } else {
      assert.equal((await publishing).url, 'https://github.com/customer/diagnostics/pull/1');
      assert.equal(visibilityChecks, 3); assert.equal(writes.length, 5);
      assert.equal(writes.at(-1)?.body.draft, true);
      for (const privateValue of [publish.title, candidate.rationale, candidate.risk, privateKeyPem]) assert.equal(JSON.stringify(writes).includes(privateValue), false);
    }
  }
});
