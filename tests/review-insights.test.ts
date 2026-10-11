import assert from 'node:assert/strict';
import test from 'node:test';
import { demoOverview } from '../src/review-demo.js';
import type { RecoveryChange, ReviewJob, ReviewOverview } from '../lib/review/types.js';
import {
  changeInsights, createRedactedHandoff, DEFAULT_STALLED_AFTER_MS, exportRedactedAuditCsv,
  filterReviewChanges, REVIEW_INSIGHT_LIMITATION, summarizeReviewQueue,
} from '../lib/review/insights.js';

const now = Date.parse('2026-10-11T12:00:00.000Z');
const recent = '2026-10-11T11:59:00.000Z';
const old = '2026-10-11T11:00:00.000Z';
const baseCommit = 'a'.repeat(40), patchHash = 'b'.repeat(64);
function fixture(): ReviewOverview {
  const overview = structuredClone(demoOverview);
  overview.projects[0].connectionStatus = 'connected';
  overview.changes = overview.changes.map((change, index) => ({ ...change, createdAt: `2026-10-11T0${index + 1}:00:00.000Z`, updatedAt: `2026-10-11T0${3 - index}:00:00.000Z`, createdBy: index ? 'reviewer-actor' : 'technician-actor' }));
  return overview;
}
function tested(overview: ReviewOverview): RecoveryChange {
  const change = overview.changes[0];
  Object.assign(change, { status: 'approved', baseCommit, patchHash,
    verification: { status: 'passed', baselineFailed: true, candidatePassed: true, provider: 'GitHub Actions', summary: 'PRIVATE_VERIFICATION_SUMMARY', evidenceHash: 'c'.repeat(64), baseCommit, patchHash, checkedAt: recent },
    approval: { userId: 'reviewer-actor', evidenceVersion: 1, baseCommit, patchHash, createdAt: recent },
  });
  return change;
}
function job(overview: ReviewOverview, overrides: Partial<ReviewJob> = {}): ReviewJob {
  return { id: 'job-one', organizationId: overview.organization.id, changeId: overview.changes[0].id, stage: 'verify', status: 'running', createdBy: 'technician-actor', createdAt: old, updatedAt: recent, message: 'PRIVATE_JOB_MESSAGE', reservedCents: 5, ...overrides };
}

test('fresh evidence and matching records report narrow reference checks, not authorization', () => {
  const overview = fixture(), change = tested(overview);
  const result = changeInsights(change, overview, { now });
  assert.deepEqual(result.evidence, { state: 'current', changeVersion: 1, currentVersion: 1 });
  assert.equal(result.verification.binding, 'matches');
  assert.equal(result.verification.recordedPassed, true);
  assert.deepEqual(result.approval, { binding: 'matches', independentActor: true });
  assert.equal(result.needsAttention, false);
  assert.equal(result.limitation, REVIEW_INSIGHT_LIMITATION);
  assert.match(result.limitation, /do not rerun tests/);
  assert.equal('canApprove' in result, false);
  assert.equal('canPublish' in result, false);
});

test('linked sample projects remain pending and are distinguished from missing project records', () => {
  const overview = structuredClone(demoOverview), change = overview.changes[0];
  assert.equal(change.projectId, overview.projects[0].id);
  assert.equal(overview.projects[0].connectionStatus, 'pending');
  const projectWarning = () => changeInsights(change, overview, { now }).warnings.find(item => item.code === 'project_unavailable');
  assert.match(projectWarning()!.message, /project is linked.*connection is still pending/);
  assert.equal(change.verification, null);
  assert.equal(change.approval, null);
  assert.equal(change.draftPrUrl, null);
  overview.projects[0].organizationId = 'another-organization';
  assert.match(projectWarning()!.message, /linked project record is not present/);
  overview.projects = [];
  assert.match(projectWarning()!.message, /linked project record is not present/);
  change.projectId = null;
  assert.equal(projectWarning(), undefined);
});

test('evidence freshness compares versions and does not silently update old references', () => {
  const overview = fixture(), change = tested(overview);
  overview.laptops[0].evidenceVersion = 2;
  const result = changeInsights(change, overview, { now });
  assert.equal(result.evidence.state, 'stale');
  assert.equal(result.approval.binding, 'matches', 'Approval still matches its historical change record, not the new passport revision.');
  assert(result.warnings.some(item => item.code === 'evidence_stale'));
  assert.equal(change.evidenceVersion, 1);
  assert.equal(result.needsAttention, true);
});

test('missing, malformed and cross-organization laptop revisions are unknown', () => {
  for (const modify of [
    (overview: ReviewOverview) => { overview.laptops = []; },
    (overview: ReviewOverview) => { overview.laptops[0].organizationId = 'another-organization'; },
    (overview: ReviewOverview) => { overview.laptops[0].evidenceVersion = NaN; },
  ]) {
    const overview = fixture(); modify(overview);
    const result = changeInsights(overview.changes[0], overview, { now });
    assert.equal(result.evidence.state, 'unknown');
    assert(result.warnings.some(item => item.code === 'evidence_unknown'));
  }
  const overview = fixture(); overview.changes[0].evidenceVersion = 0;
  assert(changeInsights(overview.changes[0], overview, { now }).warnings.some(item => item.code === 'evidence_missing'));
});

test('verification binds both base and patch without trusting a passed label alone', () => {
  for (const field of ['baseCommit', 'patchHash'] as const) {
    const overview = fixture(), change = tested(overview);
    change.verification![field] = (field === 'baseCommit' ? 'd'.repeat(40) : 'e'.repeat(64));
    const result = changeInsights(change, overview, { now });
    assert.equal(result.verification.binding, 'mismatch');
    assert.equal(result.verification.recordedPassed, true);
    assert(result.warnings.some(item => item.code === 'verification_stale'));
  }
  const overview = fixture(), change = tested(overview);
  change.verification!.baselineFailed = false;
  assert.equal(changeInsights(change, overview, { now }).verification.recordedPassed, false);
  change.baseCommit = 'not-a-commit';
  assert.equal(changeInsights(change, overview, { now }).verification.binding, 'unknown');
  change.verification = null;
  assert.equal(changeInsights(change, overview, { now }).verification.binding, 'missing');
});

test('approval checks evidence version, both references and separate actor identity', () => {
  for (const field of ['evidenceVersion', 'baseCommit', 'patchHash'] as const) {
    const overview = fixture(), change = tested(overview);
    if (field === 'evidenceVersion') change.approval!.evidenceVersion = 2;
    else change.approval![field] = field === 'baseCommit' ? 'd'.repeat(40) : 'e'.repeat(64);
    const result = changeInsights(change, overview, { now });
    assert.equal(result.approval.binding, 'mismatch');
    assert(result.warnings.some(item => item.code === 'approval_stale'));
  }
  const overview = fixture(), change = tested(overview);
  change.approval!.userId = change.createdBy;
  const result = changeInsights(change, overview, { now });
  assert.equal(result.approval.independentActor, false);
  assert(result.warnings.some(item => item.code === 'self_approval'));
  change.approval = null;
  assert.deepEqual(changeInsights(change, overview, { now }).approval, { binding: 'missing', independentActor: null });
  assert(changeInsights(change, overview, { now }).warnings.some(item => item.code === 'approval_missing'));
  change.verification = null;
  assert(changeInsights(change, overview, { now }).warnings.some(item => item.code === 'verification_incomplete'));
});

test('delayed jobs include only active matching-tenant records and do not assert failure', () => {
  const overview = fixture();
  overview.jobs = [
    job(overview, { id: 'queued', status: 'queued', updatedAt: old }),
    job(overview, { id: 'running', status: 'running', updatedAt: old }),
    job(overview, { id: 'waiting', status: 'waiting', updatedAt: old }),
    job(overview, { id: 'recent', updatedAt: recent }),
    job(overview, { id: 'completed', status: 'completed', updatedAt: old }),
    job(overview, { id: 'cancelled', status: 'cancelled', updatedAt: old }),
    job(overview, { id: 'other-change', changeId: overview.changes[1].id, updatedAt: old }),
    job(overview, { id: 'other-tenant', organizationId: 'foreign', updatedAt: old }),
  ];
  const result = changeInsights(overview.changes[0], overview, { now });
  assert.equal(result.activeJobCount, 4);
  assert.deepEqual(result.delayedJobs.map(item => item.id), ['queued', 'running', 'waiting']);
  assert.equal(result.delayedJobs[0].ageMs, 3_600_000);
  assert.match(result.warnings.find(item => item.code === 'job_delayed')!.message, /does not prove failure/);
  assert.equal(overview.jobs[0].status, 'queued');
});

test('future or invalid job timestamps are unknown; threshold boundary and invalid options are explicit', () => {
  const overview = fixture();
  overview.jobs = [job(overview, { updatedAt: new Date(now - DEFAULT_STALLED_AFTER_MS).toISOString() })];
  assert.equal(changeInsights(overview.changes[0], overview, { now }).delayedJobs.length, 1);
  for (const updatedAt of ['not-a-date', new Date(now + 1).toISOString()]) {
    overview.jobs = [job(overview, { updatedAt })];
    const result = changeInsights(overview.changes[0], overview, { now });
    assert.equal(result.delayedJobs.length, 0);
    assert(result.warnings.some(item => item.code === 'job_time_unknown'));
  }
  assert.throws(() => changeInsights(overview.changes[0], overview, { now: NaN }), /valid observation time/);
  assert.throws(() => changeInsights(overview.changes[0], overview, { now, stalledAfterMs: 0 }), /threshold/);
});

test('queue filters combine status, project, tier, text and requester; missing actor never means everyone', () => {
  const overview = fixture(); overview.changes[0].modelTier = 'nano';
  assert.deepEqual(filterReviewChanges(overview, { statuses: ['open'], projectId: 'demo-project', modelTiers: ['nano'], query: 'THINKPAD', mineOnly: true, actorId: 'technician-actor', now }).map(item => item.id), [overview.changes[0].id]);
  assert.equal(filterReviewChanges(overview, { projectId: null, now }).length, 2);
  assert.equal(filterReviewChanges(overview, { mineOnly: true, now }).length, 0);
  assert.equal(filterReviewChanges(overview, { query: 'Battery diagnostics example', now }).length, 1);
  assert.equal(filterReviewChanges(overview, { query: 'example/battery-diagnostics', now }).length, 1);
  assert.equal(filterReviewChanges(overview, { query: 'PRIVATE_PATCH_CONTENT', now }).length, 0);
  overview.changes[0].patch = 'PRIVATE_PATCH_CONTENT'; overview.evidence[0].content = 'PRIVATE_EVIDENCE_QUERY';
  assert.equal(filterReviewChanges(overview, { query: 'PRIVATE_PATCH_CONTENT', now }).length, 0);
  assert.equal(filterReviewChanges(overview, { query: 'PRIVATE_EVIDENCE_QUERY', now }).length, 0);
});

test('sorts use update recency or oldest creation with deterministic ties and invalid timestamps last', () => {
  const overview = fixture();
  overview.changes[2].updatedAt = 'invalid';
  overview.changes[1].updatedAt = overview.changes[0].updatedAt;
  const original = overview.changes.map(item => item.id);
  assert.deepEqual(filterReviewChanges(overview, { sort: 'updated' }).map(item => item.id), original);
  assert.deepEqual(filterReviewChanges(overview, { sort: 'oldest' }).map(item => item.id), original);
  overview.changes[2].createdAt = '2026-10-10T00:00:00.000Z';
  assert.equal(filterReviewChanges(overview, { sort: 'oldest' })[0].id, original[2]);
  assert.deepEqual(overview.changes.map(item => item.id), original, 'Sorting must not change the loaded array.');
});

test('attention and status summary count only loaded tenant records and distinguish delayed jobs from failed changes', () => {
  const overview = fixture();
  overview.changes[0].status = 'awaiting_approval';
  overview.changes[1].status = 'hardware_review';
  overview.changes[2].status = 'published';
  overview.jobs = [job(overview, { updatedAt: old })];
  overview.changes.push({ ...overview.changes[0], id: 'foreign', organizationId: 'foreign' });
  assert.deepEqual(filterReviewChanges(overview, { attentionOnly: true, now }).map(item => item.id), overview.changes.slice(0, 3).map(item => item.id));
  const summary = summarizeReviewQueue(overview, { now });
  assert.equal(summary.scope, 'loaded_records_only'); assert.equal(summary.total, 3);
  assert.equal(summary.attention, 3); assert.equal(summary.delayedJobs, 1); assert.equal(summary.activeJobs, 1);
  assert.equal(summary.awaitingApproval, 1); assert.equal(summary.publishedDrafts, 1); assert.equal(summary.byStatus.failed, 0);
  assert.equal(summary.byModel.lightning, 3);
  assert.throws(() => changeInsights(overview.changes[3], overview, { now }), /loaded organization/);
});

test('redacted exports require explicit opt-in and never include free text, identifiers, code, URLs or arbitrary fields', () => {
  const overview = fixture(), change = tested(overview);
  overview.organization.name = 'PRIVATE_ORGANIZATION';
  change.title = 'PRIVATE_TITLE'; change.description = 'PRIVATE_DESCRIPTION'; change.patch = 'PRIVATE_PATCH'; change.reviewSummary = 'PRIVATE_REVIEW';
  change.draftPrUrl = 'https://github.com/private/repository/pull/1';
  overview.laptops[0].assetTag = 'PRIVATE_ASSET'; overview.projects[0].repository = 'PRIVATE_REPOSITORY';
  overview.jobs = [job(overview)];
  overview.audit = [{ id: 'PRIVATE_EVENT_ID', organizationId: overview.organization.id, actorId: 'PRIVATE_ACTOR_ID', action: 'completeJob', subjectId: change.id, createdAt: recent, details: { password: 'PRIVATE_PASSWORD', nested: { token: 'PRIVATE_TOKEN', source: 'PRIVATE_SOURCE' } } }];
  Object.assign(change, { privateKey: 'PRIVATE_KEY', rawSource: 'PRIVATE_RAW' });
  assert.throws(() => createRedactedHandoff(overview, undefined as never), /Confirm/);
  assert.throws(() => exportRedactedAuditCsv(overview, { confirmed: false } as never), /Confirm/);
  const report = createRedactedHandoff(overview, { confirmed: true, now });
  const exported = JSON.stringify(report) + exportRedactedAuditCsv(overview, { confirmed: true, now });
  for (const value of ['PRIVATE_', overview.organization.id, change.id, change.laptopId, change.projectId!, change.createdBy, baseCommit, patchHash, change.draftPrUrl, overview.evidence[0].content]) assert(!exported.includes(value), value);
  assert.equal(report.changes[0].reference, 'change-1');
  assert.equal(report.changes[0].requester?.startsWith('actor-'), true);
  assert.equal(report.changes[0].verification.binding, 'matches');
  assert.equal(report.changes[0].approval.independentActor, true);
  assert.equal(report.generatedAt, new Date(now).toISOString());
});

test('audit CSV uses only known actions, normalized times and aliases; formulas and arbitrary details are removed', () => {
  const overview = fixture();
  overview.audit = [
    { id: 'event-one', organizationId: overview.organization.id, actorId: '=DANGEROUS_ACTOR', action: '=HYPERLINK("PRIVATE")', subjectId: '+DANGEROUS_SUBJECT', createdAt: 'PRIVATE_DATE', details: { code: 'PRIVATE_CODE' } },
    { id: 'event-two', organizationId: overview.organization.id, actorId: 'reviewer-actor', action: 'approveChange', subjectId: overview.changes[0].id, createdAt: recent, details: {} },
    { id: 'foreign', organizationId: 'foreign', actorId: 'PRIVATE_FOREIGN', action: 'PRIVATE_FOREIGN_ACTION', subjectId: null, createdAt: recent, details: {} },
  ];
  const csv = exportRedactedAuditCsv(overview, { confirmed: true, now });
  assert.match(csv, /"approveChange"/); assert.match(csv, /"unrecognized_action"/);
  assert.match(csv, /"unlisted-record"/); assert.match(csv, /"change-1"/);
  assert(!/PRIVATE|DANGEROUS|HYPERLINK|=|\+DANGEROUS/u.test(csv));
  assert.equal(csv.split('\r\n').filter(Boolean).length, 3);
});

test('redacted handoff has bounded records and explicit coverage rather than a full-organization claim', () => {
  const overview = fixture();
  overview.changes = Array.from({ length: 205 }, (_, index) => ({ ...overview.changes[0], id: `change-${index}` }));
  overview.jobs = Array.from({ length: 203 }, (_, index) => job(overview, { id: `job-${index}` }));
  overview.audit = Array.from({ length: 103 }, (_, index) => ({ id: `event-${index}`, organizationId: overview.organization.id, actorId: 'actor', action: 'createChange', subjectId: null, createdAt: recent, details: {} }));
  const result = createRedactedHandoff(overview, { confirmed: true, now });
  assert.equal(result.scope, 'loaded_records_only'); assert.equal(result.changes.length, 200); assert.equal(result.jobs.length, 200);
  assert.deepEqual(result.coverage, { changesLoaded: 205, changesExported: 200, jobsLoaded: 203, jobsExported: 200 });
  assert.equal(exportRedactedAuditCsv(overview, { confirmed: true, now }).split('\r\n').filter(Boolean).length, 101);
});

test('insights, summaries, filters and exports preserve every supplied record', () => {
  const overview = fixture(); tested(overview); overview.jobs = [job(overview, { updatedAt: old })];
  const before = structuredClone(overview);
  changeInsights(overview.changes[0], overview, { now });
  filterReviewChanges(overview, { attentionOnly: true, sort: 'oldest', now });
  summarizeReviewQueue(overview, { now });
  createRedactedHandoff(overview, { confirmed: true, now });
  exportRedactedAuditCsv(overview, { confirmed: true, now });
  assert.deepEqual(overview, before);
});
