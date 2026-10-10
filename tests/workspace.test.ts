import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleRecoveryBatch, defaultRecoveryLimits } from '../lib/recovery-data';
import { WORKSPACE_STORAGE_KEY, addWorkspace, deleteCompanyWorkspace, deleteSavedBatch, emptyWorkspaceStore, getSavedBatch, getWorkspace, parseWorkspaceStore, persistWorkspaceRecord, profileLimits, readWorkspaceRecord, restoreWorkspaceBackup, saveBatchCopy, selectWorkspaceBatch, updateActiveBatch, updateCompanyProfile, workspaceSelectionKey, companyProfileSchema } from '../lib/workspace';

const profile = { name: 'North Refurb', site: 'Bengaluru bench', type: 'refurbisher' as const, defaultBudgetCents: 2500, defaultTechnicianMinutes: 180 };
const now = '2026-10-10T12:00:00.000Z';
const populated = () => saveBatchCopy(addWorkspace(emptyWorkspaceStore(), 'north', profile), 'batch-one', sampleRecoveryBatch, defaultRecoveryLimits, now);

test('company profiles and saved batch resources survive a validated JSON round trip', () => {
  const store = populated();
  assert.deepEqual(parseWorkspaceStore(JSON.stringify(store)), store);
  assert.equal(getWorkspace(store)?.profile.name, 'North Refurb');
  assert.deepEqual(profileLimits(profile), defaultRecoveryLimits);
  assert.equal(companyProfileSchema.parse({ ...profile, name: '  Workshop  ' }).name, 'Workshop');
});

test('switching company and saved batch keeps inventories and limits isolated', () => {
  let store = populated();
  store = addWorkspace(store, 'south', { ...profile, name: 'South School', type: 'school' });
  store = saveBatchCopy(store, 'batch-two', { ...sampleRecoveryBatch, name: 'South stock' }, { ...defaultRecoveryLimits, budgetCents: 0 }, now);
  store = updateActiveBatch(store, { ...sampleRecoveryBatch, name: 'South changed' }, { ...defaultRecoveryLimits, technicianMinutes: 45 }, now);
  assert.equal(getSavedBatch(store)?.batch.name, 'South changed');
  store = selectWorkspaceBatch(store, 'north', 'batch-one');
  assert.equal(getSavedBatch(store)?.batch.name, sampleRecoveryBatch.name);
  assert.deepEqual(getSavedBatch(store)?.limits, defaultRecoveryLimits);
  assert.throws(() => selectWorkspaceBatch(store, 'north', 'batch-two'), /does not belong/);
  assert.throws(() => selectWorkspaceBatch(store, 'missing'), /does not exist/);
});

test('review context changes across distinct saved batches even when inventory is identical', () => {
  let store = populated();
  const original = workspaceSelectionKey(store);
  store = saveBatchCopy(store, 'batch-copy', sampleRecoveryBatch, defaultRecoveryLimits, now);
  assert.notEqual(workspaceSelectionKey(store), original);
  store = addWorkspace(store, 'second-company', profile);
  store = saveBatchCopy(store, 'batch-one', sampleRecoveryBatch, defaultRecoveryLimits, now);
  assert.notEqual(workspaceSelectionKey(store), original);
});

test('profile edits change defaults without rewriting existing batch constraints', () => {
  const store = populated();
  const updated = updateCompanyProfile(store, { ...profile, name: 'New name', defaultBudgetCents: 0 });
  assert.equal(getWorkspace(updated)?.profile.defaultBudgetCents, 0);
  assert.equal(getSavedBatch(updated)?.limits.budgetCents, defaultRecoveryLimits.budgetCents);
  assert.equal(getWorkspace(store)?.profile.name, 'North Refurb');
});

test('unsaved preview cannot overwrite a stored batch and unchanged data is a no-op', () => {
  const empty = addWorkspace(emptyWorkspaceStore(), 'north', profile);
  assert.strictEqual(updateActiveBatch(empty, sampleRecoveryBatch, defaultRecoveryLimits), empty);
  assert.equal(getSavedBatch(empty), undefined);
  const store = populated();
  assert.strictEqual(updateActiveBatch(store, sampleRecoveryBatch, defaultRecoveryLimits), store);
});

test('invalid persisted ownership, duplicate IDs and unavailable parts are rejected', () => {
  const store = populated();
  for (const mutate of [
    (value: typeof store) => { value.activeWorkspaceId = 'missing'; },
    (value: typeof store) => { value.activeWorkspaceId = null; },
    (value: typeof store) => { value.workspaces[0].activeBatchId = 'missing'; },
    (value: typeof store) => { value.workspaces[0].activeBatchId = null; },
    (value: typeof store) => { value.workspaces.push(structuredClone(value.workspaces[0])); },
    (value: typeof store) => { value.workspaces[0].batches.push(structuredClone(value.workspaces[0].batches[0])); },
    (value: typeof store) => { value.workspaces[0].batches[0].limits.unavailablePartIds = ['unknown-part']; },
  ]) {
    const value = structuredClone(store); mutate(value);
    assert.throws(() => parseWorkspaceStore(JSON.stringify(value)));
  }
  assert.throws(() => parseWorkspaceStore(' '.repeat(5_000_001)), /limit/);
  assert.throws(() => companyProfileSchema.parse({ ...profile, defaultTechnicianMinutes: 10001 }));
  assert.throws(() => saveBatchCopy(store, 'batch-one', sampleRecoveryBatch, defaultRecoveryLimits));
});

test('removal affects only the chosen local batch or company and selects a valid remaining record', () => {
  let store = populated();
  store = saveBatchCopy(store, 'batch-copy', { ...sampleRecoveryBatch, name: 'Keep this batch' }, defaultRecoveryLimits, now);
  store = addWorkspace(store, 'south', { ...profile, name: 'Keep this company' });
  store = saveBatchCopy(store, 'south-batch', sampleRecoveryBatch, defaultRecoveryLimits, now);
  store = selectWorkspaceBatch(store, 'north');
  const afterBatch = deleteSavedBatch(store, 'batch-copy');
  assert.equal(getSavedBatch(afterBatch)?.id, 'batch-one');
  assert.equal(afterBatch.workspaces.find(workspace => workspace.id === 'south')?.batches.length, 1);
  assert.equal(store.workspaces.find(workspace => workspace.id === 'north')?.batches.length, 2);
  assert.throws(() => deleteSavedBatch(afterBatch, 'south-batch'), /active company/);
  const afterCompany = deleteCompanyWorkspace(afterBatch, 'north');
  assert.equal(getWorkspace(afterCompany)?.profile.name, 'Keep this company');
  assert.equal(getSavedBatch(afterCompany)?.id, 'south-batch');
  const empty = deleteCompanyWorkspace(afterCompany, 'south');
  assert.deepEqual(empty, emptyWorkspaceStore());
  assert.equal(getSavedBatch(deleteSavedBatch(populated(), 'batch-one')), undefined);
});

test('backup restore remaps ownership and saved batch IDs while preserving existing companies and resource data', () => {
  const store = populated(), original = JSON.stringify(store);
  let index = 0;
  const restored = restoreWorkspaceBackup(store, original, kind => `${kind}-restored-${++index}`);
  assert.equal(restored.workspaces.length, 2);
  assert.deepEqual(restored.workspaces[0], store.workspaces[0]);
  assert.equal(JSON.stringify(store), original, 'restore must not mutate the live store');
  assert.notEqual(restored.activeWorkspaceId, store.activeWorkspaceId);
  assert.notEqual(getSavedBatch(restored)?.id, getSavedBatch(store)?.id);
  assert.deepEqual(getSavedBatch(restored)?.batch, getSavedBatch(store)?.batch);
  assert.deepEqual(getSavedBatch(restored)?.limits, getSavedBatch(store)?.limits);
  assert.equal(getWorkspace(restored)?.profile.name, 'North Refurb (restored)');
  assert.notEqual(workspaceSelectionKey(restored), workspaceSelectionKey(store));
  assert.deepEqual(parseWorkspaceStore(JSON.stringify(restored)), restored);
});

test('restore preserves the active batch mapping and supports companies without saved batches', () => {
  let backup = saveBatchCopy(populated(), 'second-batch', { ...sampleRecoveryBatch, name: 'Selected batch' }, { ...defaultRecoveryLimits, budgetCents: 0 }, now);
  backup = addWorkspace(backup, 'empty-company', profile);
  backup = selectWorkspaceBatch(backup, 'north', 'second-batch');
  let index = 0;
  const restored = restoreWorkspaceBackup(emptyWorkspaceStore(), JSON.stringify(backup), kind => `${kind}-${++index}`);
  assert.equal(getSavedBatch(restored)?.batch.name, 'Selected batch');
  assert.equal(getSavedBatch(restored)?.limits.budgetCents, 0);
  assert.equal(restored.workspaces[1].batches.length, 0);
  assert.equal(restored.workspaces[1].activeBatchId, null);
});

test('invalid, over-capacity and colliding restores reject the entire operation', () => {
  let full = emptyWorkspaceStore();
  for (let index = 0; index < 8; index++) full = addWorkspace(full, `company-${index}`, profile);
  const before = JSON.stringify(full);
  assert.throws(() => restoreWorkspaceBackup(full, JSON.stringify(populated()), () => 'fresh-id'), /exceed 8/);
  assert.equal(JSON.stringify(full), before);
  const malformed = populated(); malformed.workspaces[0].batches[0].limits.unavailablePartIds = ['unknown'];
  assert.throws(() => restoreWorkspaceBackup(emptyWorkspaceStore(), JSON.stringify(malformed), () => 'fresh-id'));
  assert.throws(() => restoreWorkspaceBackup(emptyWorkspaceStore(), JSON.stringify(emptyWorkspaceStore()), () => 'fresh-id'), /no company/);
  assert.throws(() => restoreWorkspaceBackup(populated(), JSON.stringify(populated()), () => 'north'), /already in use/);
  assert.throws(() => restoreWorkspaceBackup(emptyWorkspaceStore(), 'not JSON', () => 'fresh-id'));
});

test('startup preserves corrupt original storage and only an explicit recovery decision resumes persistence', () => {
  for (const original of ['', '{broken-json', JSON.stringify({ version: 900, workspaces: ['future schema'] })]) {
    const values = new Map([[WORKSPACE_STORAGE_KEY, original]]);
    let writes = 0;
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { writes++; values.set(key, value); } };
    const loaded = readWorkspaceRecord(storage);
    assert.equal(loaded.recoveryRaw, original);
    assert.deepEqual(loaded.store, emptyWorkspaceStore());
    assert.equal(persistWorkspaceRecord(storage, populated(), loaded.recoveryRaw), false);
    assert.equal(values.get(WORKSPACE_STORAGE_KEY), original);
    assert.equal(writes, 0, 'even a newly created workspace must not overwrite the original during recovery');
    assert.equal(persistWorkspaceRecord(storage, populated(), null), true);
    assert.equal(writes, 1);
    assert.equal(readWorkspaceRecord(storage).recoveryRaw, null);
    assert.deepEqual(readWorkspaceRecord(storage).store, populated());
  }
});
