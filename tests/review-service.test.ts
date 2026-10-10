import assert from 'node:assert/strict';
import test from 'node:test';
import { createReviewService, focusedEvidence, type ServiceOptions, type StorePort } from '../lib/review/service.js';
import { ReviewStoreError, type JobCompletion, type ReviewChangeContext } from '../lib/review/store.js';
import { candidateHash, sha256, snapshotHash, type CandidatePatch, type IndependentReview, type PublishInput, type RepositorySnapshot, type VerificationProof } from '../lib/review/github.js';
import { evidenceDigest, stageReservationCents } from '../lib/review/harness.js';
import type { JobStage, ReviewJob } from '../lib/review/types.js';
import { demoOverview } from '../src/review-demo.js';

const org = '11111111-1111-4111-8111-111111111111', changeId = '22222222-2222-4222-8222-222222222222', jobId = '33333333-3333-4333-8333-333333333333';
const env = { REVIEW_WORKER_SECRET: 'test-worker-secret-at-least-thirty-two-characters', LANGSMITH_TRACING: 'false' };
const usage = { estimatedCostCents: 1, promptTokens: 100, completionTokens: 50, usageReported: true };
function fixture(stage: JobStage = 'investigate', checkpoint: Record<string, unknown> = {}) {
  const context: ReviewChangeContext = { change: { ...structuredClone(demoOverview.changes[0]), id: changeId, organizationId: org }, laptop: { ...structuredClone(demoOverview.laptops[0]), organizationId: org }, evidence: structuredClone(demoOverview.evidence.slice(0, 1)), project: { ...structuredClone(demoOverview.projects[0]), organizationId: org, connectionStatus: 'connected', repository: 'company/diagnostics' } };
  const job: ReviewJob = { id: jobId, organizationId: org, changeId, stage, status: 'queued', createdBy: context.change.createdBy, createdAt: '2026-10-10T00:00:00.000Z', updatedAt: '2026-10-10T00:00:00.000Z', message: '', reservedCents: stageReservationCents('super', 'patch') };
  const state = { context, job, checkpoint: structuredClone(checkpoint), completions: [] as JobCompletion[], calls: [] as string[] };
  const core: Partial<StorePort> = {
    listOrganizations: async () => [{ ...demoOverview.organization, id: org, role: 'owner' }],
    getChangeContext: async () => { state.calls.push('context'); return state.context; },
    getJob: async () => { state.calls.push('getJob'); return state.job; },
    reserveJob: async (_org, _change, nextStage, _key, amount) => { state.calls.push('reserve'); state.job.stage = nextStage; state.job.reservedCents = amount; return state.job; },
    claimJob: async () => { state.calls.push('claim'); return { job: state.job, checkpoint: structuredClone(state.checkpoint), leaseToken: 'lease-test-token' }; },
    saveCheckpoint: async (_org, _job, _lease, next) => { state.calls.push('checkpoint'); state.checkpoint = structuredClone(next); },
    completeJob: async (_org, _job, result) => { state.calls.push('complete'); state.completions.push(structuredClone(result)); state.checkpoint = structuredClone(result.checkpoint ?? {}); state.job = { ...state.job, status: result.status, message: result.message }; if (result.change) Object.assign(state.context.change, result.change); return state.job; },
  };
  const store = new Proxy(core, { get(target, name) { if (name in target) return target[name as keyof StorePort]; return async () => { throw new Error(`Unexpected test store method ${String(name)}`); }; } }) as StorePort;
  const service = (dependencies: Partial<ServiceOptions> = {}) => createReviewService({ store, userId: 'test-actor', env, ...dependencies });
  return { state, store, core, service };
}
const resume = { action: 'resumeJob' as const, organizationId: org, jobId };
const run = (stage: JobStage) => ({ action: 'runJob' as const, organizationId: org, changeId, stage, idempotencyKey: jobId });
function artifact(context: ReviewChangeContext) {
  const files = [
    { path: 'src/diagnostics/battery.mjs', content: 'export const health = () => 0;\n', sha256: sha256('export const health = () => 0;\n'), blobSha: '1'.repeat(40) },
    { path: 'tests/diagnostics/battery.test.mjs', content: 'import assert from "node:assert/strict";\n', sha256: sha256('import assert from "node:assert/strict";\n'), blobSha: '2'.repeat(40) },
  ];
  const rawSnapshot = { repository: { installationId: 1, repositoryId: 2, owner: 'company', name: 'diagnostics', defaultBranch: 'main', isPrivate: false }, baseSha: 'a'.repeat(40), treeSha: 'b'.repeat(40), targetPath: files[0].path, files };
  const snapshot: RepositorySnapshot = { ...rawSnapshot, hash: snapshotHash(rawSnapshot) };
  const digest = evidenceDigest(focusedEvidence(context));
  const rawCandidate = { path: snapshot.targetPath, content: 'export const health = () => 75;\n', rationale: 'Correct the ratio calculation.', risk: 'Only a synthetic numeric fixture.', baseSha: snapshot.baseSha, snapshotHash: snapshot.hash, evidenceHash: digest };
  const candidate: CandidatePatch = { ...rawCandidate, hash: candidateHash(rawCandidate) };
  const proof: VerificationProof = { snapshotHash: snapshot.hash, candidateHash: candidate.hash, evidenceHash: digest, imageId: 'test-image', baselineOperationId: 'baseline-run', candidateOperationId: 'candidate-run', baselineFailed: 1, baselinePassed: 0, candidatePassed: 1, candidateFailed: 0, testNamesHash: sha256('battery diagnostics fixture'), networkDisabled: true, completedAt: '2026-10-10T01:00:00.000Z', provider: 'GitHub Actions isolated container' };
  const review: IndependentReview = { approved: true, reasons: ['The observed failure is covered by the existing test.'], candidateHash: candidate.hash, model: 'nvidia/Nemotron-3_5-Lightning' };
  return { snapshot, candidate, proof, review, digest };
}

test('investigation reserves budget and checkpoints before the model call', async () => {
  const { state, service } = fixture();
  const result = await service({ investigate: async input => { state.calls.push('model'); assert.equal(input.modelTier, 'lightning'); assert.equal(state.checkpoint.inFlight, 'nebius-investigation'); return { classification: 'software', summary: 'A parser issue is supported by the supplied fixture.', findings: [], nextSteps: ['Inspect the parser.'], model: 'Nebius-test', usage }; } })(run('investigate')) as ReviewJob;
  assert.equal(result.status, 'completed'); assert.equal(state.context.change.status, 'open');
  assert.ok(state.calls.indexOf('reserve') < state.calls.indexOf('model')); assert.ok(state.calls.indexOf('checkpoint') < state.calls.indexOf('model'));
  assert.equal(state.completions[0].spentCents, 1); assert.equal(state.checkpoint.inFlight, undefined);
});

test('hardware and insufficient evidence classifications never claim a software fix', async () => {
  for (const classification of ['hardware', 'insufficient_evidence'] as const) {
    const { state, service } = fixture();
    await service({ investigate: async () => ({ classification, summary: 'A safe next step is needed.', findings: [], nextSteps: ['Ask a technician for evidence.'], model: 'Nebius-test', usage }) })(run('investigate'));
    assert.equal(state.context.change.status, classification === 'hardware' ? 'hardware_review' : 'needs_evidence');
    assert.equal(state.context.change.patch, null); assert.equal(state.context.change.verification, null);
  }
});

test('missing or changed evidence stops work before an inference call', async () => {
  for (const missing of [true, false]) {
    const { state, service } = fixture(); if (missing) state.context.evidence = []; else state.context.laptop.evidenceVersion++;
    let called = false;
    const result = await service({ investigate: async () => { called = true; throw new Error('must not run'); } })(resume) as ReviewJob;
    assert.equal(result.status, 'failed'); assert.equal(called, false); assert.equal(state.completions[0].spentCents, 0);
    assert.match(result.message, missing ? /Add a technician note/ : /evidence changed/);
  }
});

test('an evidence hash mismatch invalidates a saved stage checkpoint', async () => {
  const { state, service } = fixture('investigate', { evidenceHash: 'f'.repeat(64) });
  let called = false;
  const result = await service({ investigate: async () => { called = true; throw new Error('must not run'); } })(resume) as ReviewJob;
  assert.equal(result.status, 'failed'); assert.equal(called, false); assert.equal(state.completions[0].spentCents, 0);
  assert.match(result.message, /evidence no longer matches/);
});

test('an uncertain prior external call is not repeated and conservatively retains its charge', async () => {
  const { state, service } = fixture('investigate', { inFlight: 'nebius-investigation' });
  let called = false;
  const result = await service({ investigate: async () => { called = true; throw new Error('must not run'); } })(resume) as ReviewJob;
  assert.equal(result.status, 'failed'); assert.equal(called, false); assert.match(result.message, /not be repeated automatically/);
  assert.equal(state.completions[0].spentCents, state.job.reservedCents);
  await service()(resume); assert.equal(state.completions.length, 1);
});

test('invalid persisted snapshots stop before a model call or budget charge', async () => {
  const { state, service } = fixture('patch');
  const { snapshot } = artifact(state.context);
  state.context.change.investigation = { classification: 'software', summary: 'Observed parser failure', findings: [], nextSteps: ['Fix the parser'], model: 'test' };
  state.checkpoint = { snapshot: { ...snapshot, hash: '0'.repeat(64) } };
  let called = false;
  const result = await service({ propose: async () => { called = true; throw new Error('must not run'); } })(resume) as ReviewJob;
  assert.equal(result.status, 'failed'); assert.equal(called, false);
  assert.equal(state.completions[0].spentCents, 0);
  assert.equal(state.checkpoint.inFlight, undefined);
});

test('unrecognized model errors are sanitized and do not produce a successful result', async () => {
  const { state, service } = fixture();
  const result = await service({ investigate: async () => { throw new Error('private source and secret-api-token'); } })(run('investigate')) as ReviewJob;
  assert.equal(result.status, 'failed'); assert.equal(result.message.includes('secret-api-token'), false); assert.equal(state.context.change.investigation, null);
  assert.equal(state.completions[0].spentCents, state.job.reservedCents);
});

test('reservation and lease refusal stop all external work', async () => {
  for (const method of ['reserveJob', 'claimJob'] as const) {
    const { core, state, service } = fixture();
    core[method] = async () => { throw new ReviewStoreError(429, 'QUOTA_EXCEEDED', 'Quota or lease refused.'); };
    let called = false;
    await assert.rejects(service({ investigate: async () => { called = true; throw new Error('must not run'); } })(run('investigate')), /Quota or lease refused/);
    assert.equal(called, false); assert.equal(state.completions.length, 0);
  }
});

test('terminal jobs return idempotently without another lease or charge', async () => {
  for (const status of ['completed', 'failed', 'cancelled'] as const) {
    const { state, service } = fixture(); state.job.status = status;
    assert.equal((await service()(resume) as ReviewJob).status, status);
    assert.deepEqual(state.calls, ['getJob']); assert.equal(state.completions.length, 0);
  }
});

test('patch snapshot and model writing occupy separate resumable requests', async () => {
  const { state, service } = fixture('patch'); const { snapshot, candidate } = artifact(state.context);
  state.context.change.investigation = { classification: 'software', summary: 'The parser fixture reproduces a numeric issue.', findings: [], nextSteps: ['Review the module.'], model: 'Nebius-test' };
  let writes = 0, reads = 0;
  const dependencies: Partial<ServiceOptions> = { github: { readSnapshot: async () => { reads++; return snapshot; } } as unknown as ServiceOptions['github'], propose: async input => { writes++; assert.equal(input.modelTier, 'super'); return { ...candidate, usage, model: 'Nemotron Super' }; } };
  const first = await service(dependencies)(run('patch')) as ReviewJob;
  assert.equal(first.status, 'waiting'); assert.equal(reads, 1); assert.equal(writes, 0); assert.equal(state.completions[0].spentCents, 0);
  const second = await service(dependencies)(resume) as ReviewJob;
  assert.equal(second.status, 'completed'); assert.equal(reads, 1); assert.equal(writes, 1);
  assert.equal(state.context.change.patchHash, candidate.hash); assert.match(state.context.change.patch ?? '', /^--- a\/src\/diagnostics\/battery\.mjs/);
  assert.equal(state.context.change.verification, null);
});

test('isolated Actions verification persists a receipt and does not dispatch on every check', async () => {
  const { state, service } = fixture('verify'); const { snapshot, candidate, proof } = artifact(state.context);
  state.checkpoint = { snapshot, candidate }; let starts = 0, polls = 0;
  const dependencies: Partial<ServiceOptions> = { actions: { startActionsVerification: async () => { starts++; return { correlationId: 'fixture' }; }, pollActionsVerification: async () => { polls++; return polls === 1 ? { status: 'pending', message: 'Still running.' } : { status: 'passed', proof }; } } as unknown as ServiceOptions['actions'] };
  assert.equal((await service(dependencies)(resume) as ReviewJob).status, 'waiting');
  assert.equal((await service(dependencies)(resume) as ReviewJob).status, 'waiting');
  assert.equal((await service(dependencies)(resume) as ReviewJob).status, 'completed');
  assert.equal(starts, 1); assert.equal(polls, 2); assert.equal(state.context.change.verification?.status, 'passed');
  assert.equal(state.context.change.verification?.provider, 'GitHub Actions isolated container');
});

test('failed isolated verification never records a passed claim', async () => {
  const { state, service } = fixture('verify'); const { snapshot, candidate } = artifact(state.context);
  state.checkpoint = { snapshot, candidate, backend: 'actions', actions: { correlationId: 'fixture' } };
  const result = await service({ actions: { pollActionsVerification: async () => ({ status: 'failed', message: 'Candidate tests failed.' }) } as unknown as ServiceOptions['actions'] })(resume) as ReviewJob;
  assert.equal(result.status, 'failed'); assert.equal(state.context.change.verification, null); assert.match(result.message, /Candidate tests failed/);
});

test('review requires verification and model rejection prevents approval state', async () => {
  const missing = fixture('review'); const artifacts = artifact(missing.state.context); missing.state.checkpoint = { snapshot: artifacts.snapshot, candidate: artifacts.candidate };
  let called = false;
  const result = await missing.service({ review: async () => { called = true; throw new Error('must not run'); } })(resume) as ReviewJob;
  assert.equal(result.status, 'failed'); assert.equal(called, false); assert.match(result.message, /Complete isolated/);
  const rejected = fixture('review'); rejected.state.checkpoint = { snapshot: artifacts.snapshot, candidate: artifacts.candidate, verification: artifacts.proof };
  const rejectedResult = await rejected.service({ review: async input => { assert.equal(input.modelTier, 'super'); assert.equal(input.evidence,focusedEvidence(rejected.state.context)); return { ...artifacts.review, approved: false, reasons: ['A boundary case is not handled.'], usage }; } })(resume) as ReviewJob;
  assert.equal(rejectedResult.status, 'failed'); assert.equal(rejected.state.context.change.status, 'failed'); assert.equal(rejected.state.context.change.approval, null);
});

test('publication requires current exact human approval and an approving model review', async () => {
  for (const defect of ['missing', 'wrong-evidence', 'wrong-patch', 'wrong-base', 'model-rejected'] as const) {
    const { state, service } = fixture('publish'); const { snapshot, candidate, proof, review } = artifact(state.context);
    state.checkpoint = { snapshot, candidate, verification: proof, review: { ...review, approved: defect !== 'model-rejected' } };
    if (defect !== 'missing') state.context.change.approval = { userId: 'another-reviewer', evidenceVersion: defect === 'wrong-evidence' ? 9 : 1, baseCommit: defect === 'wrong-base' ? 'c'.repeat(40) : snapshot.baseSha, patchHash: defect === 'wrong-patch' ? 'd'.repeat(64) : candidate.hash, createdAt: '2026-10-10T02:00:00.000Z' };
    let called = false;
    const result = await service({ github: { publishDraft: async () => { called = true; throw new Error('must not publish'); } } as unknown as ServiceOptions['github'] })(resume) as ReviewJob;
    assert.equal(result.status, 'failed'); assert.equal(called, false); assert.equal(state.context.change.draftPrUrl, null);
  }
});

test('approved publication requests only a draft and records its returned URL', async () => {
  const { state, service } = fixture('publish'); const { snapshot, candidate, proof, review } = artifact(state.context);
  state.checkpoint = { snapshot, candidate, verification: proof, review };
  state.context.change.approval = { userId: 'different-reviewer', evidenceVersion: 1, baseCommit: snapshot.baseSha, patchHash: candidate.hash, createdAt: '2026-10-10T02:00:00.000Z' };
  const result = await service({ github: { publishDraft: async (input: PublishInput) => { assert.equal(input.approval.approvedBy, 'different-reviewer'); assert.equal(input.approval.requestedBy, state.context.change.createdBy); assert.equal(state.checkpoint.inFlight, 'github-publication'); return { url: 'https://github.com/company/diagnostics/pull/1' }; } } as unknown as ServiceOptions['github'] })(resume) as ReviewJob;
  assert.equal(result.status, 'completed'); assert.equal(state.context.change.status, 'published'); assert.equal(state.context.change.draftPrUrl, 'https://github.com/company/diagnostics/pull/1');
  assert.equal(state.context.laptop.status, 'held');
});

test('project connection checks organization role before repository access', async () => {
  const { core, service } = fixture(); core.listOrganizations = async () => [{ ...demoOverview.organization, id: org, role: 'technician' }];
  let called = false;
  await assert.rejects(service({ github: { discoverRepository: async () => { called = true; throw new Error('must not run'); } } as unknown as ServiceOptions['github'] })({ action: 'connectProject', organizationId: org, repository: 'company/diagnostics', installationId: 1, targetPath: 'src/diagnostics/battery.mjs', testPaths: ['tests/diagnostics/battery.test.mjs'], githubUserToken: 'one-time-proof-token' }), /owner or administrator/);
  assert.equal(called, false);
});

test('private project connection refuses the public verification runner', async () => {
  const { service } = fixture();
  await assert.rejects(service({ github: { discoverRepository: async () => ({ installationId: 1, repositoryId: 2, owner: 'company', name: 'diagnostics', defaultBranch: 'main', isPrivate: true }) } as unknown as ServiceOptions['github'] })({ action: 'connectProject', organizationId: org, repository: 'company/diagnostics', installationId: 1, targetPath: 'src/diagnostics/battery.mjs', testPaths: ['tests/diagnostics/battery.test.mjs'], githubUserToken: 'one-time-proof-token' }), /public diagnostic repositories only/);
});

test('focused evidence is bounded and retains observed source information', () => {
  const { state } = fixture();
  const evidence = JSON.parse(focusedEvidence(state.context)); assert.equal(evidence.evidence[0].source, 'Synthetic parser fixture'); assert.equal(evidence.evidenceVersion, 1);
  state.context.evidence = Array(50).fill(state.context.evidence[0]); assert.throws(() => focusedEvidence(state.context), /focused review limit/);
});
