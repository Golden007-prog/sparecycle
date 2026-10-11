import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleRecoveryBatch, defaultRecoveryLimits } from '../lib/recovery-data';
import { planRecovery } from '../lib/recovery';
import { addPilotNote, archivePilotRun, copyPilotRunToWorkspace, createPilotRun, emptyPilotStore, parsePilotStore, pilotHandoff, pilotReadiness, pilotRunSchema, pilotScorecard, pilotSourceMatches, recordPilotCheck, recordPilotWork, restorePilotRuns, savePilotRun, setPilotAssignment, transitionPilotDevice, voidPilotWork, type PilotRun } from '../lib/pilot';
const now = '2026-10-11T10:00:00.000Z', later = '2026-10-11T10:01:00.000Z';
function fixture(): PilotRun { return createPilotRun({ id: 'run-1', workspaceKey: 'demo:preview', batch: sampleRecoveryBatch, limits: defaultRecoveryLimits, now }); }
function started(): PilotRun { const run = fixture(); return transitionPilotDevice(run, run.devices[0].deviceId, 'in_progress', 'Technician began the planned work.', later); }
function passed(run: PilotRun): PilotRun { for (const kind of ['function', 'sanitization', 'accessories'] as const) run = recordPilotCheck(run, run.devices[0].deviceId, { kind, status: 'passed', evidenceNote: `Synthetic observation only; check ${kind}, report DEMO-001.` }, later); return run; }

test('pilot freezes only deterministic proposals and cannot trust supplied assignments', () => {
  const plan = planRecovery(sampleRecoveryBatch, defaultRecoveryLimits);
  const input = structuredClone(sampleRecoveryBatch);
  const run = createPilotRun({ id: 'run', workspaceKey: 'company:batch', batch: input, limits: defaultRecoveryLimits, plan: { ...plan, assignments: [] }, now });
  assert.deepEqual(run.devices.map(device => device.deviceId), plan.assignments.map(job => job.deviceId));
  input.name = 'Changed'; assert.notEqual(run.batch.name, input.name);
  assert.equal(pilotSourceMatches(run, sampleRecoveryBatch, defaultRecoveryLimits), true);
  assert.equal(pilotSourceMatches(run, sampleRecoveryBatch, { ...defaultRecoveryLimits, budgetCents: 0 }), false);
  const broken = structuredClone(run); broken.devices[0].deviceId = 'invented'; assert.equal(pilotRunSchema.safeParse(broken).success, false);
  assert.throws(() => createPilotRun({ id: 'empty', workspaceKey: 'demo', batch: input, limits: { ...defaultRecoveryLimits, technicianMinutes: 0 }, now }), /no complete/);
});
test('pilot rejects invalid state skips and requires reasons while preserving old snapshots', () => {
  const before = fixture(), deviceId = before.devices[0].deviceId;
  assert.throws(() => transitionPilotDevice(before, deviceId, 'completed', 'Skipped', later), /not allowed/);
  assert.throws(() => transitionPilotDevice(before, deviceId, 'blocked', '', later));
  const blocked = transitionPilotDevice(before, deviceId, 'blocked', 'Waiting for inspection.', later);
  assert.equal(blocked.devices[0].blockReason, 'Waiting for inspection.');
  assert.equal(before.devices[0].status, 'queued');
  assert.throws(() => transitionPilotDevice(blocked, deviceId, 'completed', 'Skipped', later));
  const resumed = transitionPilotDevice(blocked, deviceId, 'in_progress', 'Inspection complete.', later);
  assert.equal(resumed.devices[0].blockReason, '');
  assert.throws(() => addPilotNote(resumed, deviceId, 'Old event.', now), /earlier/);
  assert.throws(() => addPilotNote(resumed, 'other-device', 'Wrong record.', later), /not part/);
});
test('work ledger sums integer cents and minutes and corrections retain original records', () => {
  let run = started(); const deviceId = run.devices[0].deviceId;
  run = recordPilotWork(run, deviceId, { minutes: 17, costCents: 315, note: 'Synthetic bench work record.' }, later);
  run = recordPilotWork(run, deviceId, { minutes: 3, costCents: 25, note: 'Synthetic additional effort.' }, later);
  assert.equal(pilotScorecard(run).actualMinutes, 20); assert.equal(pilotScorecard(run).actualCostCents, 340);
  const corrected = voidPilotWork(run, deviceId, run.devices[0].work[0].id, 'Duplicate transcription corrected.', later);
  assert.equal(pilotScorecard(corrected).actualMinutes, 3); assert.equal(corrected.devices[0].work.length, 2);
  assert.equal(run.devices[0].work[0].voidReason, '');
  assert.throws(() => voidPilotWork(corrected, deviceId, corrected.devices[0].work[0].id, 'Another correction.', later), /active/);
  for (const entry of [{ minutes: -1, costCents: 0 }, { minutes: 0, costCents: 0 }, { minutes: 2.2, costCents: 10 }, { minutes: 1, costCents: 0.1 }]) assert.throws(() => recordPilotWork(run, deviceId, { ...entry, note: 'Invalid record.' }, later));
  assert.throws(() => recordPilotWork(fixture(), deviceId, { minutes: 1, costCents: 0, note: 'Not started.' }, later), /Start or resume/);
});
test('readiness requires completion and three evidence-referenced declarations; rework invalidates checks', () => {
  let run = started(); const deviceId = run.devices[0].deviceId;
  assert.throws(() => recordPilotCheck(run, deviceId, { kind: 'function', status: 'passed', evidenceNote: 'OK' }, later));
  run = passed(run); assert.equal(pilotReadiness(run, deviceId).ready, false);
  run = transitionPilotDevice(run, deviceId, 'completed', 'Technician recorded completion.', later);
  assert.equal(pilotReadiness(run, deviceId).ready, true);
  assert.equal(pilotScorecard(run).handoffReady, 1);
  const handoff = pilotHandoff(run, deviceId); assert.match(handoff.declaration, /not independently verified/);
  assert.throws(() => transitionPilotDevice(run, deviceId, 'in_progress', 'Again', later), /10 characters/);
  const reopened = transitionPilotDevice(run, deviceId, 'in_progress', 'A new symptom requires another check.', later);
  assert.equal(pilotReadiness(reopened, deviceId).ready, false);
  assert.ok(reopened.devices[0].checks.every(check => check.status === 'pending'));
});
test('additional bench work invalidates earlier QA and failed QA prevents readiness', () => {
  let run = passed(started()); const deviceId = run.devices[0].deviceId;
  run = recordPilotWork(run, deviceId, { minutes: 3, costCents: 0, note: 'Adjusted an earlier installation.' }, later);
  assert.ok(run.devices[0].checks.every(check => check.status === 'pending'));
  run = passed(run);
  run = recordPilotCheck(run, deviceId, { kind: 'function', status: 'failed', evidenceNote: 'Test fixture: restart check failed, REF-02.' }, later);
  run = transitionPilotDevice(run, deviceId, 'completed', 'Work complete; final check has a failure.', later);
  assert.equal(pilotReadiness(run, deviceId).ready, false);
});
test('blocking after QA invalidates prior checks even when work has no further ledger entry', () => {
  let run = passed(started()); const deviceId = run.devices[0].deviceId;
  run = transitionPilotDevice(run, deviceId, 'blocked', 'Another observed fault needs inspection.', later);
  run = transitionPilotDevice(run, deviceId, 'in_progress', 'Returned to the bench after inspection.', later);
  run = transitionPilotDevice(run, deviceId, 'completed', 'Technician recorded work completion.', later);
  assert.equal(pilotReadiness(run, deviceId).ready, false);
  assert.ok(run.devices[0].checks.every(check => check.status === 'pending'));
});
test('import rejects future child records and passed checks older than physical work', () => {
  let run = passed(started()); const deviceId = run.devices[0].deviceId;
  run = transitionPilotDevice(run, deviceId, 'completed', 'Technician recorded completion.', later);
  const future = structuredClone(run); future.devices[0].notes[0].recordedAt = '2026-10-12T10:00:00.000Z';
  assert.equal(pilotRunSchema.safeParse(future).success, false);
  const stale = structuredClone(run); stale.updatedAt = '2026-10-11T10:02:00.000Z';
  stale.devices[0].work.push({ id: 'late-work', minutes: 5, costCents: 0, note: 'Later physical work from an imported log.', recordedAt: stale.updatedAt, voidReason: '' });
  assert.equal(pilotRunSchema.safeParse(stale).success, false);
  assert.equal(pilotReadiness(stale, deviceId).ready, false);
});
test('assignment validates real dates, archived runs cannot mutate, notes remain plain data', () => {
  let run = fixture(); const deviceId = run.devices[0].deviceId;
  for (const dueDate of ['2026-02-30', '2026-13-01', 'tomorrow']) assert.throws(() => setPilotAssignment(run, deviceId, { assignedTo: 'Demo technician', dueDate }, later));
  run = setPilotAssignment(run, deviceId, { assignedTo: 'Demo technician', dueDate: '2026-10-15' }, later);
  assert.equal(run.devices[0].assignedTo, 'Demo technician');
  run = addPilotNote(run, deviceId, '<script>not executable</script>', later);
  assert.match(run.devices[0].notes.at(-1)!.text, /script/);
  run = archivePilotRun(run, true, later);
  assert.throws(() => addPilotNote(run, deviceId, 'Should be blocked.', later), /Unarchive/);
  assert.equal(archivePilotRun(run, false, later).archived, false);
});
test('validated stores preserve workspace bindings, reject corruption and restore without overwrite', () => {
  const run = fixture(), store = savePilotRun(emptyPilotStore(), run), raw = JSON.stringify(store);
  assert.deepEqual(parsePilotStore(raw), store);
  const restored = restorePilotRuns(store, raw, () => 'restored-run');
  assert.equal(restored.runs.length, 2); assert.equal(restored.runs[1].workspaceKey, run.workspaceKey);
  assert.throws(() => restorePilotRuns(store, raw, () => run.id));
  assert.throws(() => parsePilotStore('{broken'));
  assert.throws(() => parsePilotStore('x'.repeat(5_000_001)), /5 MB/);
  assert.throws(() => savePilotRun(store, { ...run, workspaceKey: 'other' }), /another/);
  const tampered = structuredClone(store); tampered.runs[0].batch.name = 'Rewritten history';
  assert.throws(() => parsePilotStore(JSON.stringify(tampered)));
  let full = emptyPilotStore(); for (let index = 0; index < 12; index++) full = savePilotRun(full, { ...run, id: `run-${index}` });
  assert.throws(() => savePilotRun(full, { ...run, id: 'run-13' }));
});
test('explicit workspace recovery preserves the original and requires new QA in the destination', () => {
  let run = passed(started()); const deviceId = run.devices[0].deviceId;
  run = transitionPilotDevice(run, deviceId, 'completed', 'Technician recorded completion.', later);
  const store = savePilotRun(emptyPilotStore(), run);
  const recovered = copyPilotRunToWorkspace(store, run.id, 'restored-company:new-batch', 'recovered-1', later);
  assert.deepEqual(recovered.runs[0], run); assert.equal(store.runs.length, 1);
  assert.deepEqual(recovered.runs[1].batch, run.batch);
  assert.equal(recovered.runs[1].workspaceKey, 'restored-company:new-batch');
  assert.equal(pilotReadiness(recovered.runs[1], deviceId).ready, false);
  assert.throws(() => copyPilotRunToWorkspace(store, run.id, 'restored-company:new-batch', run.id, later), /new identifier/);
  assert.throws(() => copyPilotRunToWorkspace(store, 'missing', 'restored-company:new-batch', 'new', later), /Choose a saved/);
});

test('workspace recovery preserves a full note ledger without blocking recovery or dropping history', () => {
  const run = fixture();
  run.devices[0].notes = Array.from({ length: 100 }, (_, index) => ({ id: `historical-${index}`, text: `Historical observation ${index}.`, recordedAt: now }));
  const store = savePilotRun(emptyPilotStore(), run);
  const recovered = copyPilotRunToWorkspace(store, run.id, 'restored:batch', 'full-history-copy', later);
  assert.deepEqual(recovered.runs[0], run);
  assert.deepEqual(recovered.runs[1].devices[0].notes, run.devices[0].notes);
  assert.equal(recovered.runs[1].devices[0].notes.length, 100);
  assert.match(recovered.runs[1].name, /^Recovered:/);
  assert(recovered.runs[1].devices[0].checks.every(check => check.status === 'pending' && check.evidenceNote.startsWith('Recovery copy:')));
  assert.equal(pilotReadiness(recovered.runs[1], run.devices[0].deviceId).ready, false);
  assert.equal(store.runs.length, 1);
});
