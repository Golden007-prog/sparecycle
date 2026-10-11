import { z } from 'zod';
import { planRecovery } from './recovery';
import { recoveryBatchSchema, recoveryLimitsSchema, type RecoveryBatch, type RecoveryLimits, type RecoveryPlan } from './recovery-types';

/** Browser-local operator declarations. These records are not a certified or tamper-proof audit. */
export const PILOT_STORAGE_KEY = 'sparecycle.pilot.v1';
export const PILOT_MAX_RUNS = 12;
export const PILOT_CHECK_KINDS = ['function', 'sanitization', 'accessories'] as const;
const id = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/);
const timestamp = z.string().datetime();
const date = z.string().refine(value => {
  if (value === '') return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Choose a valid calendar date.');
const note = z.string().trim().min(3).max(1000);
const checkSchema = z.object({ kind: z.enum(PILOT_CHECK_KINDS), status: z.enum(['pending', 'passed', 'failed']), evidenceNote: z.string().trim().max(1000), recordedAt: timestamp }).strict().superRefine((check, ctx) => {
  if (check.status !== 'pending' && check.evidenceNote.length < 10) ctx.addIssue({ code: 'custom', path: ['evidenceNote'], message: 'Record an evidence reference and observation of at least 10 characters.' });
});
const workSchema = z.object({ id, minutes: z.number().int().min(0).max(1440), costCents: z.number().int().min(0).max(1_000_000), note, recordedAt: timestamp, voidReason: z.string().trim().max(1000) }).strict().superRefine((entry, ctx) => {
  if (entry.minutes === 0 && entry.costCents === 0) ctx.addIssue({ code: 'custom', message: 'Record some time or cost; use a note for an observation.' });
  if (entry.voidReason && entry.voidReason.length < 10) ctx.addIssue({ code: 'custom', path: ['voidReason'], message: 'Explain the correction in at least 10 characters.' });
});
const noteSchema = z.object({ id, text: note, recordedAt: timestamp }).strict();
const deviceSchema = z.object({
  deviceId: id, status: z.enum(['queued', 'in_progress', 'blocked', 'completed']),
  assignedTo: z.string().trim().max(80), dueDate: date, blockReason: z.string().trim().max(1000),
  work: z.array(workSchema).max(100), checks: z.array(checkSchema).length(3), notes: z.array(noteSchema).max(100),
}).strict().superRefine((device, ctx) => {
  if (new Set(device.checks.map(check => check.kind)).size !== 3) ctx.addIssue({ code: 'custom', path: ['checks'], message: 'Keep exactly one current check of each kind.' });
  for (const field of ['work', 'notes'] as const) if (new Set(device[field].map(entry => entry.id)).size !== device[field].length) ctx.addIssue({ code: 'custom', path: [field], message: 'Record identifiers must be unique.' });
  if (device.status === 'blocked' ? device.blockReason.length < 3 : device.blockReason !== '') ctx.addIssue({ code: 'custom', path: ['blockReason'], message: 'Only a blocked job has an active block reason.' });
});
export const pilotRunSchema = z.object({
  id, name: z.string().trim().min(1).max(160), workspaceKey: z.string().min(1).max(200), createdAt: timestamp, updatedAt: timestamp,
  sourceFingerprint: z.string().max(160_000), batch: recoveryBatchSchema, limits: recoveryLimitsSchema,
  devices: z.array(deviceSchema).min(1).max(18), archived: z.boolean(),
}).strict().superRefine((run, ctx) => {
  const deviceIds = run.devices.map(device => device.deviceId);
  if (new Set(deviceIds).size !== deviceIds.length) ctx.addIssue({ code: 'custom', path: ['devices'], message: 'A device can have only one job in a run.' });
  if (run.sourceFingerprint !== sourceFingerprint(run.batch, run.limits)) ctx.addIssue({ code: 'custom', path: ['sourceFingerprint'], message: 'The frozen planning inputs were changed.' });
  if (Date.parse(run.updatedAt) < Date.parse(run.createdAt)) ctx.addIssue({ code: 'custom', path: ['updatedAt'], message: 'The update cannot precede creation.' });
  for (const [deviceIndex, device] of run.devices.entries()) {
    for (const field of ['work', 'checks', 'notes'] as const) for (const [index, entry] of device[field].entries()) {
      const at = Date.parse(entry.recordedAt);
      if (at < Date.parse(run.createdAt) || at > Date.parse(run.updatedAt)) ctx.addIssue({ code: 'custom', path: ['devices', deviceIndex, field, index, 'recordedAt'], message: 'A record timestamp must fall within the run history.' });
    }
    const latestWork = Math.max(Date.parse(run.createdAt), ...device.work.filter(entry => !entry.voidReason).map(entry => Date.parse(entry.recordedAt)));
    if (device.checks.some(check => check.status === 'passed' && Date.parse(check.recordedAt) < latestWork)) ctx.addIssue({ code: 'custom', path: ['devices', deviceIndex, 'checks'], message: 'Passed checks must be recorded after the latest work.' });
  }
  if (run.limits.unavailablePartIds.some(partId => !run.batch.parts.some(part => part.id === partId))) ctx.addIssue({ code: 'custom', path: ['limits'], message: 'Unavailable parts must belong to the frozen batch.' });
  // Imported local data cannot invent a planned assignment or bypass held devices.
  const expected = planRecovery(run.batch, run.limits).assignments.map(job => job.deviceId).sort();
  if (JSON.stringify([...deviceIds].sort()) !== JSON.stringify(expected)) ctx.addIssue({ code: 'custom', path: ['devices'], message: 'Jobs must match the frozen deterministic proposal.' });
});
export const pilotStoreSchema = z.object({ version: z.literal(1), runs: z.array(pilotRunSchema).max(96) }).strict().superRefine((store, ctx) => {
  const counts = new Map<string, number>();
  if (new Set(store.runs.map(run => run.id)).size !== store.runs.length) ctx.addIssue({ code: 'custom', path: ['runs'], message: 'Run identifiers must be unique.' });
  for (const run of store.runs) counts.set(run.workspaceKey, (counts.get(run.workspaceKey) ?? 0) + 1);
  if ([...counts.values()].some(count => count > PILOT_MAX_RUNS)) ctx.addIssue({ code: 'custom', path: ['runs'], message: `Keep at most ${PILOT_MAX_RUNS} runs in each browser workspace.` });
});
export type PilotRun = z.infer<typeof pilotRunSchema>;
export type PilotDevice = z.infer<typeof deviceSchema>;
export type PilotStore = z.infer<typeof pilotStoreSchema>;
export type PilotStatus = PilotDevice['status'];
export type PilotCheck = z.infer<typeof checkSchema>;
export const emptyPilotStore = (): PilotStore => ({ version: 1, runs: [] });
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonical(entry)]));
  return value;
}
function sourceFingerprint(batch: RecoveryBatch, limits: RecoveryLimits) { return JSON.stringify(canonical({ batch, limits })); }
export function pilotSourceMatches(run: PilotRun, batch: RecoveryBatch, limits: RecoveryLimits) { return run.sourceFingerprint === sourceFingerprint(batch, limits); }
export function createPilotRun(input: { id: string; workspaceKey: string; batch: RecoveryBatch; limits: RecoveryLimits; plan?: RecoveryPlan; now: string; name?: string }): PilotRun {
  const batch = recoveryBatchSchema.parse(input.batch), limits = recoveryLimitsSchema.parse(input.limits);
  if (limits.unavailablePartIds.some(partId => !batch.parts.some(part => part.id === partId))) throw new Error('Unavailable parts must belong to this batch.');
  const plan = planRecovery(batch, limits);
  if (!plan.assignments.length) throw new Error('This proposal has no complete repair candidates. Resolve planning constraints before starting a run.');
  return pilotRunSchema.parse({ id: input.id, name: input.name ?? batch.name, workspaceKey: input.workspaceKey, createdAt: input.now, updatedAt: input.now, sourceFingerprint: sourceFingerprint(batch, limits), batch, limits, archived: false, devices: plan.assignments.map(job => ({ deviceId: job.deviceId, status: 'queued', assignedTo: '', dueDate: '', blockReason: '', work: [], notes: [], checks: PILOT_CHECK_KINDS.map(kind => ({ kind, status: 'pending', evidenceNote: '', recordedAt: input.now })) })) });
}
function update(run: PilotRun, deviceId: string, now: string, fn: (device: PilotDevice) => void): PilotRun {
  timestamp.parse(now);
  const copy = pilotRunSchema.parse(run);
  if (copy.archived) throw new Error('Unarchive this run before editing its records.');
  if (Date.parse(now) < Date.parse(copy.updatedAt)) throw new Error('The update time is earlier than the saved run.');
  const device = copy.devices.find(entry => entry.deviceId === deviceId);
  if (!device) throw new Error('This device is not part of the frozen proposal.');
  fn(device); copy.updatedAt = now;
  return pilotRunSchema.parse(copy);
}
function addNote(device: PilotDevice, text: string, now: string) { device.notes.push({ id: `note-${crypto.randomUUID()}`, text: note.parse(text), recordedAt: now }); }
export function transitionPilotDevice(run: PilotRun, deviceId: string, status: PilotStatus, reason: string, now: string) {
  return update(run, deviceId, now, device => {
    const allowed: Record<PilotStatus, PilotStatus[]> = { queued: ['in_progress', 'blocked'], in_progress: ['blocked', 'completed'], blocked: ['in_progress'], completed: ['in_progress'] };
    if (!allowed[device.status].includes(status)) throw new Error('That work-state transition is not allowed. Start or resume work before completing it.');
    const text = z.string().trim().min(3).max(800).parse(reason);
    if (device.status === 'completed' && text.length < 10) throw new Error('Explain the rework in at least 10 characters.');
    if (device.status === 'completed' || device.status === 'blocked' || status === 'blocked') device.checks = PILOT_CHECK_KINDS.map(kind => ({ kind, status: 'pending', evidenceNote: 'Work changed or was blocked; record a new check.', recordedAt: now }));
    addNote(device, `${device.status} → ${status}: ${text}`, now);
    device.status = status; device.blockReason = status === 'blocked' ? text : '';
  });
}
export function setPilotAssignment(run: PilotRun, deviceId: string, input: { assignedTo: string; dueDate: string }, now: string) {
  return update(run, deviceId, now, device => {
    device.assignedTo = z.string().trim().max(80).parse(input.assignedTo); device.dueDate = date.parse(input.dueDate);
    addNote(device, `Assignment: ${device.assignedTo || 'Unassigned'}; due ${device.dueDate || 'not scheduled'}.`, now);
  });
}
export function recordPilotWork(run: PilotRun, deviceId: string, input: { minutes: number; costCents: number; note: string }, now: string) {
  return update(run, deviceId, now, device => {
    if (device.status !== 'in_progress') throw new Error('Start or resume work before adding a work record.');
    device.work.push(workSchema.parse({ ...input, id: `work-${crypto.randomUUID()}`, recordedAt: now, voidReason: '' }));
    // Any additional bench work makes earlier physical checks stale.
    device.checks = PILOT_CHECK_KINDS.map(kind => ({ kind, status: 'pending', evidenceNote: 'New work recorded; repeat the check.', recordedAt: now }));
  });
}
export function voidPilotWork(run: PilotRun, deviceId: string, workId: string, reason: string, now: string) {
  return update(run, deviceId, now, device => {
    const entry = device.work.find(work => work.id === workId);
    if (!entry || entry.voidReason) throw new Error('Choose an active work record to correct.');
    entry.voidReason = z.string().trim().min(10).max(800).parse(reason);
    addNote(device, `Work record corrected: ${entry.voidReason}`, now);
  });
}
export function recordPilotCheck(run: PilotRun, deviceId: string, input: Pick<PilotCheck, 'kind' | 'status' | 'evidenceNote'>, now: string) {
  return update(run, deviceId, now, device => {
    if (!['in_progress', 'completed'].includes(device.status)) throw new Error('Start or complete work before recording a quality check.');
    const check = checkSchema.parse({ ...input, evidenceNote: z.string().trim().max(800).parse(input.evidenceNote), recordedAt: now });
    device.checks = device.checks.map(previous => previous.kind === check.kind ? check : previous);
    addNote(device, `${check.kind} check ${check.status}: ${check.evidenceNote || 'Awaiting observation.'}`, now);
  });
}
export function addPilotNote(run: PilotRun, deviceId: string, text: string, now: string) { return update(run, deviceId, now, device => addNote(device, text, now)); }
export function archivePilotRun(run: PilotRun, archived: boolean, now: string) {
  const copy = pilotRunSchema.parse(run); timestamp.parse(now);
  if (Date.parse(now) < Date.parse(copy.updatedAt)) throw new Error('The update time is earlier than the saved run.');
  return pilotRunSchema.parse({ ...copy, archived, updatedAt: now });
}
export function pilotReadiness(run: PilotRun, deviceId: string) {
  const device = run.devices.find(entry => entry.deviceId === deviceId);
  if (!device) throw new Error('Device not found in this run.');
  const blockers: string[] = [];
  if (device.status !== 'completed') blockers.push('Work is not recorded as complete.');
  if (device.blockReason) blockers.push(`Unresolved block: ${device.blockReason}`);
  const latestWork = Math.max(Date.parse(run.createdAt), ...device.work.filter(entry => !entry.voidReason).map(entry => Date.parse(entry.recordedAt)));
  for (const kind of PILOT_CHECK_KINDS) {
    const check = device.checks.find(entry => entry.kind === kind);
    if (check?.status !== 'passed' || check.evidenceNote.trim().length < 10 || !Number.isFinite(Date.parse(check.recordedAt)) || Date.parse(check.recordedAt) < latestWork) blockers.push(`${kind === 'function' ? 'Functional' : kind === 'sanitization' ? 'Data sanitization' : 'Accessories'} check needs a passed observation and evidence reference after the latest work.`);
  }
  return { ready: blockers.length === 0, blockers };
}
export function pilotScorecard(run: PilotRun) {
  const plan = planRecovery(run.batch, run.limits);
  const work = run.devices.flatMap(device => device.work.filter(entry => !entry.voidReason));
  return { proposed: run.devices.length, started: run.devices.filter(device => device.status !== 'queued').length, blocked: run.devices.filter(device => device.status === 'blocked').length, completed: run.devices.filter(device => device.status === 'completed').length, handoffReady: run.devices.filter(device => pilotReadiness(run, device.deviceId).ready).length, plannedMinutes: plan.summary.minutes, plannedCostCents: plan.summary.costCents, actualMinutes: work.reduce((total, entry) => total + entry.minutes, 0), actualCostCents: work.reduce((total, entry) => total + entry.costCents, 0), recordedDevices: run.devices.filter(device => device.work.some(entry => !entry.voidReason)).length };
}
export function pilotHandoff(run: PilotRun, deviceId: string) {
  pilotRunSchema.parse(run);
  const device = run.devices.find(entry => entry.deviceId === deviceId);
  if (!device) throw new Error('Device not found in this run.');
  return { format: 'sparecycle-pilot-handoff-v1', run: { id: run.id, name: run.name, createdAt: run.createdAt, updatedAt: run.updatedAt, archived: run.archived }, device: run.batch.devices.find(entry => entry.id === deviceId), proposal: planRecovery(run.batch, run.limits).assignments.find(entry => entry.deviceId === deviceId), recordedWork: structuredClone(device), readiness: pilotReadiness(run, deviceId), declaration: 'Browser-local operator declarations, not independently verified repair, erasure or delivery certification. A proposed allocation does not reserve or consume inventory. Keep evidence references and follow your organization’s approved release process.' };
}
export function parsePilotStore(raw: string): PilotStore {
  if (raw.length > 5_000_000) throw new Error('Keep operations backups below 5 MB.');
  return pilotStoreSchema.parse(JSON.parse(raw));
}
export function savePilotRun(store: PilotStore, run: PilotRun): PilotStore {
  const existing = store.runs.find(entry => entry.id === run.id);
  if (existing && existing.workspaceKey !== run.workspaceKey) throw new Error('A run cannot move to another browser workspace.');
  return pilotStoreSchema.parse({ version: 1, runs: existing ? store.runs.map(entry => entry.id === run.id ? run : entry) : [...store.runs, run] });
}
/** Restore by adding new IDs, never silently overwriting a saved run. Ownership keys remain local labels. */
export function restorePilotRuns(existing: PilotStore, raw: string, newId: () => string): PilotStore {
  const incoming = parsePilotStore(raw);
  return pilotStoreSchema.parse({ version: 1, runs: [...existing.runs, ...incoming.runs.map(run => ({ ...run, id: newId() }))] });
}
/** Explicit recovery copy after a browser workspace's identifiers have changed. No inventory is merged. */
export function copyPilotRunToWorkspace(store: PilotStore, runId: string, workspaceKey: string, newId: string, now: string): PilotStore {
  const existing = pilotStoreSchema.parse(store);
  if (existing.runs.some(run => run.id === newId)) throw new Error('Choose a new identifier for the recovery copy.');
  const source = existing.runs.find(run => run.id === runId);
  if (!source) throw new Error('Choose a saved run to recover.');
  timestamp.parse(now);
  if (Date.parse(now) < Date.parse(source.updatedAt)) throw new Error('The recovery time is earlier than the saved run.');
  const copy = structuredClone(source);
  copy.id = newId; copy.workspaceKey = workspaceKey; copy.archived = false; copy.updatedAt = now;
  copy.name = `Recovered: ${source.name}`.slice(0, 160);
  for (const device of copy.devices) {
    device.checks = PILOT_CHECK_KINDS.map(kind => ({ kind, status: 'pending', evidenceNote: 'Recovery copy: confirm the device and repeat the checks in this workspace.', recordedAt: now }));
    // A full historical note ledger must remain recoverable without deleting an
    // original entry. The recovery title and reset checks also identify the copy.
    if (device.notes.length < 100) addNote(device, 'Copied from a saved local run into this browser workspace. The original planning inputs and work history were preserved; QA must be recorded again.', now);
  }
  return savePilotRun(existing, copy);
}
