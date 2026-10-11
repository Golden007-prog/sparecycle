import type { ChangeStatus, JobStage, JobStatus, ModelTier, RecoveryChange, ReviewOverview } from './types.js';

/** Read-only presentation helpers. The server remains the authority for every action. */
export const REVIEW_INSIGHT_LIMITATION = 'These checks compare loaded record references. They do not rerun tests, validate repository HEAD, prove full evidence integrity, or grant permission to approve or publish.';
export const DEFAULT_STALLED_AFTER_MS = 10 * 60 * 1_000;
const statuses: ChangeStatus[] = ['open', 'investigating', 'needs_evidence', 'hardware_review', 'patch_ready', 'testing', 'awaiting_approval', 'approved', 'published', 'failed', 'cancelled'];
const modelTiers: ModelTier[] = ['nano', 'lightning', 'super', 'ultra'];
const jobStages: JobStage[] = ['investigate', 'patch', 'verify', 'review', 'publish'];
const jobStatuses: JobStatus[] = ['queued', 'running', 'waiting', 'completed', 'failed', 'cancelled'];
const activeJobs = new Set<JobStatus>(['queued', 'running', 'waiting']);
const auditActions = new Set(['createOrganization', 'redeemInvite', 'setBudget', 'createInvite', 'createLaptop', 'addEvidence', 'connectProject', 'createChange', 'approveChange', 'reserveJob', 'claimJob', 'completeJob', 'cancelJob', 'saveCheckpoint']);

export interface InsightOptions { now?: number; stalledAfterMs?: number }
export type ReferenceBinding = 'matches' | 'mismatch' | 'missing' | 'unknown';
export type InsightCode = 'evidence_stale' | 'evidence_unknown' | 'evidence_missing' | 'verification_stale' | 'verification_incomplete' | 'approval_stale' | 'approval_missing' | 'self_approval' | 'job_delayed' | 'job_time_unknown' | 'needs_evidence' | 'hardware_review' | 'failed' | 'project_unavailable';
export interface ReviewInsightWarning { code: InsightCode; message: string }
export interface ChangeInsights {
  evidence: { state: 'current' | 'stale' | 'unknown'; changeVersion: number | null; currentVersion: number | null };
  verification: { binding: ReferenceBinding; recordedPassed: boolean; checkedAt: string | null };
  approval: { binding: ReferenceBinding; independentActor: boolean | null };
  activeJobCount: number;
  delayedJobs: Array<{ id: string; stage: JobStage; ageMs: number }>;
  warnings: ReviewInsightWarning[];
  needsAttention: boolean;
  limitation: typeof REVIEW_INSIGHT_LIMITATION;
}

const version = (value: unknown): number | null => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
function epoch(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}
const iso = (value: unknown): string | null => { const ms = epoch(value); return ms === null ? null : new Date(ms).toISOString(); };
function timing(options: InsightOptions) {
  const now = options.now ?? Date.now();
  if (!Number.isFinite(now) || Math.abs(now) > 8.64e15) throw new Error('A valid observation time is required.');
  const delay = options.stalledAfterMs ?? DEFAULT_STALLED_AFTER_MS;
  if (!Number.isFinite(delay) || delay < 60_000 || delay > 86_400_000) throw new Error('The delayed-job threshold must be between one minute and one day.');
  return { now, delay };
}
function references(change: RecoveryChange, record: { baseCommit: string; patchHash: string } | null): ReferenceBinding {
  if (!record) return 'missing';
  if (!change.baseCommit || !change.patchHash || !/^[a-f0-9]{40}$/iu.test(change.baseCommit) || !/^[a-f0-9]{64}$/iu.test(change.patchHash)
    || !/^[a-f0-9]{40}$/iu.test(record.baseCommit) || !/^[a-f0-9]{64}$/iu.test(record.patchHash)) return 'unknown';
  return record.baseCommit === change.baseCommit && record.patchHash === change.patchHash ? 'matches' : 'mismatch';
}
const organizationChanges = (overview: ReviewOverview) => overview.changes.filter(change => change.organizationId === overview.organization.id);
const organizationJobs = (overview: ReviewOverview) => overview.jobs.filter(job => job.organizationId === overview.organization.id);

/** Evidence freshness means revision equality, not physical condition or wall-clock age. */
export function changeInsights(change: RecoveryChange, overview: ReviewOverview, options: InsightOptions = {}): ChangeInsights {
  if (change.organizationId !== overview.organization.id) throw new Error('The change does not belong to the loaded organization.');
  const { now, delay } = timing(options);
  const warnings: ReviewInsightWarning[] = [];
  const add = (code: InsightCode, message: string) => { warnings.push({ code, message }); };
  const laptop = overview.laptops.find(item => item.organizationId === overview.organization.id && item.id === change.laptopId);
  const currentVersion = version(laptop?.evidenceVersion), changeVersion = version(change.evidenceVersion);
  const evidence: ChangeInsights['evidence'] = { state: currentVersion === null || changeVersion === null ? 'unknown' : currentVersion === changeVersion ? 'current' : 'stale', currentVersion, changeVersion };
  if (evidence.state === 'stale') add('evidence_stale', 'This change references a different evidence revision from the loaded laptop passport. Refresh before continuing.');
  if (evidence.state === 'unknown') add('evidence_unknown', 'The current laptop evidence revision is unavailable in the loaded records.');
  if (changeVersion === 0) add('evidence_missing', 'No evidence revision is recorded for this change.');
  const verification = { binding: references(change, change.verification), recordedPassed: change.verification?.status === 'passed' && change.verification.baselineFailed === true && change.verification.candidatePassed === true, checkedAt: iso(change.verification?.checkedAt) };
  if (verification.binding === 'mismatch') add('verification_stale', 'The recorded verification points to a different base commit or patch.');
  if ((change.verification && (verification.binding === 'unknown' || !verification.recordedPassed)) || (!change.verification && ['awaiting_approval', 'approved', 'published'].includes(change.status))) add('verification_incomplete', 'A complete failing-baseline and passing-candidate record with matching references is not available.');
  let approvalBinding = references(change, change.approval);
  if (change.approval && approvalBinding === 'matches') {
    const approvedVersion = version(change.approval.evidenceVersion);
    approvalBinding = approvedVersion === null || changeVersion === null ? 'unknown' : approvedVersion === changeVersion ? 'matches' : 'mismatch';
  }
  const independentActor = change.approval ? (change.approval.userId && change.createdBy ? change.approval.userId !== change.createdBy : null) : null;
  const approval = { binding: approvalBinding, independentActor };
  if (change.approval && approvalBinding !== 'matches') add('approval_stale', 'The recorded approval cannot be matched to this change’s evidence revision, base commit and patch.');
  if (!change.approval && ['approved', 'published'].includes(change.status)) add('approval_missing', 'This workflow status has no approval record in the loaded snapshot. Refresh and inspect the server record.');
  if (independentActor === false) add('self_approval', 'The recorded approver and requester are the same person. A separate reviewer is required by the server.');
  const jobs = organizationJobs(overview).filter(job => job.changeId === change.id && activeJobs.has(job.status));
  const delayedJobs: ChangeInsights['delayedJobs'] = [];
  let unknownTime = false;
  for (const job of jobs) {
    const updated = epoch(job.updatedAt);
    if (updated === null || updated > now) { unknownTime = true; continue; }
    const ageMs = now - updated;
    if (ageMs >= delay) delayedJobs.push({ id: job.id, stage: job.stage, ageMs });
  }
  if (delayedJobs.length) add('job_delayed', 'An active job has no recent recorded update. Refresh or inspect it; elapsed time alone does not prove failure.');
  if (unknownTime) add('job_time_unknown', 'An active job has an invalid or future update time; its delay cannot be determined.');
  if (change.projectId) {
    const project = overview.projects.find(item => item.organizationId === overview.organization.id && item.id === change.projectId);
    if (!project) add('project_unavailable', 'The linked project record is not present in the loaded organization records.');
    else if (project.connectionStatus !== 'connected') add('project_unavailable', 'The project is linked to this change, but its repository connection is still pending in the loaded records.');
  }
  if (change.status === 'needs_evidence') add('needs_evidence', 'The recorded workflow is waiting for more evidence.');
  if (change.status === 'hardware_review') add('hardware_review', 'The recorded workflow requires a workshop review.');
  if (change.status === 'failed') add('failed', 'The recorded workflow needs attention. Read its latest server response.');
  return { evidence, verification, approval, activeJobCount: jobs.length, delayedJobs, warnings, needsAttention: warnings.length > 0, limitation: REVIEW_INSIGHT_LIMITATION };
}

export interface ReviewQueueFilters extends InsightOptions {
  statuses?: ChangeStatus[];
  /** undefined selects all; null selects cases without a project. */
  projectId?: string | null;
  modelTiers?: ModelTier[];
  query?: string;
  mineOnly?: boolean;
  actorId?: string;
  attentionOnly?: boolean;
  sort?: 'updated' | 'oldest';
}
/** Searches visible labels/IDs only; never scans evidence, patches, logs or model output. */
export function filterReviewChanges(overview: ReviewOverview, filters: ReviewQueueFilters = {}): RecoveryChange[] {
  const query = (filters.query ?? '').normalize('NFKC').trim().toLowerCase().slice(0, 200);
  const filtered = organizationChanges(overview).filter(change => {
    if (filters.statuses?.length && !filters.statuses.includes(change.status)) return false;
    if (filters.projectId !== undefined && change.projectId !== filters.projectId) return false;
    if (filters.modelTiers?.length && !filters.modelTiers.includes(change.modelTier)) return false;
    if (filters.mineOnly && (!filters.actorId || change.createdBy !== filters.actorId)) return false;
    if (filters.attentionOnly && !changeInsights(change, overview, filters).needsAttention) return false;
    if (!query) return true;
    const laptop = overview.laptops.find(item => item.organizationId === overview.organization.id && item.id === change.laptopId);
    const project = overview.projects.find(item => item.organizationId === overview.organization.id && item.id === change.projectId);
    return [change.id, change.title, laptop?.assetTag, laptop?.manufacturer, laptop?.model, project?.name, project?.repository]
      .filter((value): value is string => typeof value === 'string').some(value => value.normalize('NFKC').toLowerCase().includes(query));
  });
  return filtered.sort((left, right) => {
    const a = epoch(filters.sort === 'oldest' ? left.createdAt : left.updatedAt);
    const b = epoch(filters.sort === 'oldest' ? right.createdAt : right.updatedAt);
    if (a === null && b !== null) return 1;
    if (a !== null && b === null) return -1;
    const difference = a !== null && b !== null ? (filters.sort === 'oldest' ? a - b : b - a) : 0;
    return difference || left.id.localeCompare(right.id);
  });
}

export function summarizeReviewQueue(overview: ReviewOverview, options: InsightOptions = {}) {
  const changes = organizationChanges(overview);
  const byStatus = Object.fromEntries(statuses.map(status => [status, 0])) as Record<ChangeStatus, number>;
  const byModel = Object.fromEntries(modelTiers.map(tier => [tier, 0])) as Record<ModelTier, number>;
  let attention = 0, staleEvidence = 0, delayedJobs = 0;
  for (const change of changes) {
    if (statuses.includes(change.status)) byStatus[change.status]++;
    if (modelTiers.includes(change.modelTier)) byModel[change.modelTier]++;
    const insights = changeInsights(change, overview, options);
    if (insights.needsAttention) attention++;
    if (insights.evidence.state === 'stale') staleEvidence++;
    delayedJobs += insights.delayedJobs.length;
  }
  return { scope: 'loaded_records_only' as const, total: changes.length, byStatus, byModel, attention, staleEvidence, delayedJobs,
    activeJobs: organizationJobs(overview).filter(job => activeJobs.has(job.status)).length,
    awaitingApproval: byStatus.awaiting_approval, publishedDrafts: byStatus.published };
}

export interface RedactedExportOptions extends InsightOptions { confirmed: true }
function requireExport(options?: RedactedExportOptions) {
  if (options?.confirmed !== true) throw new Error('Confirm the redacted export before creating it.');
}
const safeEnum = <T extends string>(value: T, allowed: T[]): T | 'unknown' => allowed.includes(value) ? value : 'unknown';
function aliases(overview: ReviewOverview) {
  const ids = new Map<string, string>();
  const add = (values: Array<{ id: string; organizationId: string }>, prefix: string) => {
    [...values].filter(value => value.organizationId === overview.organization.id).sort((a, b) => a.id.localeCompare(b.id))
      .forEach((value, index) => ids.set(value.id, `${prefix}-${index + 1}`));
  };
  add(overview.laptops, 'laptop'); add(overview.projects, 'project'); add(overview.changes, 'change'); add(overview.jobs, 'job');
  const actorIds = new Set<string>();
  for (const change of organizationChanges(overview)) { actorIds.add(change.createdBy); if (change.approval) actorIds.add(change.approval.userId); }
  for (const event of overview.audit.filter(item => item.organizationId === overview.organization.id)) actorIds.add(event.actorId);
  const actors = new Map([...actorIds].filter(Boolean).sort().map((id, index) => [id, `actor-${index + 1}`]));
  return { record: (id: string | null) => id ? ids.get(id) ?? 'unlisted-record' : null, actor: (id: string) => actors.get(id) ?? 'unlisted-actor' };
}

/** No automatic download/transmission. Call only after the user selects an export action. */
export function createRedactedHandoff(overview: ReviewOverview, options: RedactedExportOptions) {
  requireExport(options);
  const { now } = timing(options), alias = aliases(overview);
  const changes = filterReviewChanges(overview, { ...options, sort: 'updated' });
  const jobs = organizationJobs(overview);
  return {
    schema: 'sparecycle.redacted-handoff.v1' as const, generatedAt: new Date(now).toISOString(),
    scope: 'loaded_records_only' as const, limitation: REVIEW_INSIGHT_LIMITATION,
    redaction: 'Local aliases replace organization, member, laptop, project, change and job identifiers. Free text, evidence, code, hashes, repository paths, URLs and credentials are excluded. Timestamps, counts and workflow states remain; review before sharing.',
    summary: summarizeReviewQueue(overview, options),
    coverage: { changesLoaded: changes.length, changesExported: Math.min(changes.length, 200), jobsLoaded: jobs.length, jobsExported: Math.min(jobs.length, 200) },
    changes: changes.slice(0, 200).map(change => {
      const insight = changeInsights(change, overview, options);
      return { reference: alias.record(change.id), laptop: alias.record(change.laptopId), project: alias.record(change.projectId), requester: alias.actor(change.createdBy),
        status: safeEnum(change.status, statuses), modelTier: safeEnum(change.modelTier, modelTiers), createdAt: iso(change.createdAt), updatedAt: iso(change.updatedAt),
        evidence: insight.evidence, verification: insight.verification,
        approval: { ...insight.approval, reviewer: change.approval ? alias.actor(change.approval.userId) : null },
        warningCodes: insight.warnings.map(warning => warning.code), delayedJobCount: insight.delayedJobs.length,
      };
    }),
    jobs: [...jobs].sort((a, b) => a.id.localeCompare(b.id)).slice(0, 200).map(job => ({
      reference: alias.record(job.id), change: alias.record(job.changeId), stage: safeEnum(job.stage, jobStages), status: safeEnum(job.status, jobStatuses),
      createdAt: iso(job.createdAt), updatedAt: iso(job.updatedAt),
    })),
  };
}

/** Whitelisted, formula-safe CSV; intentionally excludes arbitrary audit details. */
export function exportRedactedAuditCsv(overview: ReviewOverview, options: RedactedExportOptions): string {
  requireExport(options);
  const alias = aliases(overview);
  const cell = (value: string | null) => '"' + (value ?? '').replace(/^[\s]*[=+@-]/u, "'$&").replace(/"/gu, '""') + '"';
  const rows = overview.audit.filter(event => event.organizationId === overview.organization.id)
    .sort((left, right) => (epoch(left.createdAt) ?? Number.MAX_SAFE_INTEGER) - (epoch(right.createdAt) ?? Number.MAX_SAFE_INTEGER) || left.id.localeCompare(right.id));
  const header = ['event', 'action', 'actor', 'subject', 'recorded_at', 'scope'];
  return [header.map(cell).join(','), ...rows.slice(0, 100).map((event, index) => [
    `event-${index + 1}`, auditActions.has(event.action) ? event.action : 'unrecognized_action', alias.actor(event.actorId),
    alias.record(event.subjectId), iso(event.createdAt), 'loaded_records_only_max_100',
  ].map(cell).join(','))].join('\r\n') + '\r\n';
}
