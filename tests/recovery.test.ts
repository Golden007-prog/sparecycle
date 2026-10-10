import test from 'node:test';
import assert from 'node:assert/strict';
import { planRecovery, RECOVERY_SEARCH_LIMIT } from '../lib/recovery';
import { sampleRecoveryBatch, defaultRecoveryLimits } from '../lib/recovery-data';
import { recoveryBatchSchema, recoveryLimitsSchema } from '../lib/recovery-types';
import type { RecoveryBatch, RecoveryDevice, RecoveryLimits, RecoveryPart, RecoveryPlan } from '../lib/recovery-types';

const device = (id: string, changes: Partial<RecoveryDevice> = {}): RecoveryDevice => ({ id, label: id, model: 'Demo approved model', needs: ['RAM'],
  repairMinutes: 10, priority: 1, eligible: true, intakeNote: 'Synthetic fixture.', qaRequired: true, ...changes });
const part = (id: string, changes: Partial<RecoveryPart> = {}): RecoveryPart => ({ id, sku: 'RAM', label: id, source: 'stock', quantity: 1,
  costCents: 0, harvestMinutes: 0, verified: true, evidenceId: 'demo', ...changes });
const batch = (devices: RecoveryDevice[], parts: RecoveryPart[]): RecoveryBatch => ({ id: 'test', name: 'Test batch', devices, parts,
  evidence: [{ id: 'demo', title: 'Demo declaration', detail: 'Synthetic approved part mapping.', kind: 'demo' }] });
const limits: RecoveryLimits = { budgetCents: 1000, technicianMinutes: 100, unavailablePartIds: [] };

function assertFeasible(input: RecoveryBatch, constraints: RecoveryLimits, plan: RecoveryPlan) {
  const usage = new Map<string, number>();
  let cash = 0;
  let minutes = 0;
  const ids = new Set<string>();
  for (const assignment of plan.assignments) {
    assert.ok(!ids.has(assignment.deviceId));
    ids.add(assignment.deviceId);
    const candidate = input.devices.find(item => item.id === assignment.deviceId)!;
    assert.equal(candidate.eligible, true);
    const actualNeeds: string[] = [];
    let localCash = 0;
    let localTime = candidate.repairMinutes;
    for (const allocation of assignment.allocations) {
      const item = input.parts.find(row => row.id === allocation.partId)!;
      assert.equal(item.verified, true);
      assert.ok(!constraints.unavailablePartIds.includes(item.id));
      assert.equal(item.sku, allocation.sku);
      assert.ok(Number.isInteger(allocation.quantity) && allocation.quantity > 0);
      usage.set(item.id, (usage.get(item.id) ?? 0) + allocation.quantity);
      assert.ok(usage.get(item.id)! <= item.quantity);
      actualNeeds.push(...Array(allocation.quantity).fill(item.sku));
      localCash += item.costCents * allocation.quantity;
      localTime += item.harvestMinutes * allocation.quantity;
    }
    assert.deepEqual(actualNeeds.sort(), [...candidate.needs].sort());
    assert.equal(assignment.costCents, localCash);
    assert.equal(assignment.minutes, localTime);
    cash += localCash;
    minutes += localTime;
  }
  assert.ok(cash <= constraints.budgetCents);
  assert.ok(minutes <= constraints.technicianMinutes);
  assert.equal(cash, plan.summary.costCents);
  assert.equal(minutes, plan.summary.minutes);
  assert.equal(plan.summary.recovered, plan.assignments.length);
}

test('demo optimizes seven proposed repairs versus five intake-order repairs without mutating inputs', () => {
  const before = JSON.stringify([sampleRecoveryBatch, defaultRecoveryLimits]);
  const plan = planRecovery(sampleRecoveryBatch, defaultRecoveryLimits);
  assert.deepEqual(plan.summary, { recovered: 7, costCents: 2500, minutes: 150, reusedParts: 6 });
  assert.deepEqual(plan.baseline, { recovered: 5, costCents: 2500, minutes: 160, reusedParts: 5 });
  assert.equal(plan.optimal, true);
  assert.ok(plan.warnings.some(warning => warning.includes('synthetic')));
  assert.equal(JSON.stringify([sampleRecoveryBatch, defaultRecoveryLimits]), before);
  assert.deepEqual(planRecovery(sampleRecoveryBatch, defaultRecoveryLimits), plan);
  assertFeasible(sampleRecoveryBatch, defaultRecoveryLimits, plan);
});

test('maximizes complete devices instead of consuming two scarce parts on one early repair', () => {
  const input = batch([device('early', { needs: ['RAM', 'SSD'], repairMinutes: 30 }), device('ram'), device('ssd', { needs: ['SSD'] })],
    [part('ram-stock'), part('ssd-stock', { sku: 'SSD' })]);
  const plan = planRecovery(input, limits);
  assert.equal(plan.baseline.recovered, 1);
  assert.equal(plan.summary.recovered, 2);
  assert.deepEqual(plan.assignments.map(item => item.deviceId), ['ram', 'ssd']);
  assertFeasible(input, limits, plan);
});

test('stock is shared, repeated SKU requirements need multiple units, and preparation is per unit', () => {
  const input = batch([device('kit', { needs: ['RAM', 'RAM'], priority: 5 }), device('single')],
    [part('donor', { source: 'donor', donorId: 'dedicated-donor', quantity: 2, harvestMinutes: 7, costCents: 100 })]);
  const plan = planRecovery(input, limits);
  assert.equal(plan.summary.recovered, 1);
  assert.equal(plan.assignments[0].deviceId, 'kit');
  assert.deepEqual(plan.assignments[0].allocations, [{ partId: 'donor', sku: 'RAM', quantity: 2 }]);
  assert.equal(plan.summary.minutes, 24);
  assert.equal(plan.summary.costCents, 200);
  assertFeasible(input, limits, plan);
});

test('zero cash still permits existing stock; zero technician time permits no repairs', () => {
  const input = batch([device('one'), device('two')], [part('owned'), part('buy', { source: 'purchase', costCents: 500 })]);
  const free = { ...limits, budgetCents: 0 };
  const plan = planRecovery(input, free);
  assert.equal(plan.summary.recovered, 1);
  assert.equal(plan.summary.costCents, 0);
  assert.equal(planRecovery(input, { ...limits, technicianMinutes: 0 }).summary.recovered, 0);
  assertFeasible(input, free, plan);
});

test('part failure replans from remaining stock without substituting unverified parts', () => {
  const failed = { ...defaultRecoveryLimits, unavailablePartIds: ['part-t480-ram-donor'] };
  const plan = planRecovery(sampleRecoveryBatch, failed);
  assert.equal(plan.summary.recovered, 6);
  assert.ok(plan.assignments.every(assignment => assignment.allocations.every(allocation => !['part-t480-ram-donor', 'part-unverified-ram'].includes(allocation.partId))));
  assertFeasible(sampleRecoveryBatch, failed, plan);
});

test('identity holds and lack of verified compatibility cannot be overridden by high priority', () => {
  const input = batch([device('held', { eligible: false, holdReason: 'Unknown model revision', priority: 10 }), device('unverified', { needs: ['UNKNOWN'] }), device('different-sku', { needs: ['RAM-LOOKALIKE'] })],
    [part('ram'), part('unknown', { sku: 'UNKNOWN', verified: false })]);
  const plan = planRecovery(input, limits);
  assert.equal(plan.summary.recovered, 0);
  assert.match(plan.unresolved.find(item => item.deviceId === 'held')!.reasons.join(' '), /Unknown model/);
  assert.match(plan.unresolved.find(item => item.deviceId === 'unverified')!.reasons.join(' '), /unverified/);
  assert.match(plan.unresolved.find(item => item.deviceId === 'different-sku')!.reasons.join(' '), /exact approved SKU/);
});

test('allocation can choose a paid fast part over a free slow donor to fit technician time', () => {
  const input = batch([device('one')], [part('slow', { source: 'donor', donorId: 'donor-a', harvestMinutes: 100 }), part('fast', { source: 'purchase', costCents: 500 })]);
  const constraints = { ...limits, technicianMinutes: 20 };
  const plan = planRecovery(input, constraints);
  assert.equal(plan.summary.recovered, 1);
  assert.equal(plan.assignments[0].allocations[0].partId, 'fast');
  assert.equal(plan.baseline.recovered, 0);
  assertFeasible(input, constraints, plan);
});

test('objective prioritizes recovery count, then priority, then cash, then preparation time', () => {
  const input = batch([device('low', { priority: 1 }), device('high', { priority: 9 })],
    [part('owned', { harvestMinutes: 5 }), part('paid', { costCents: 100, source: 'purchase', harvestMinutes: 0 })]);
  const plan = planRecovery(input, { ...limits, technicianMinutes: 15 });
  assert.equal(plan.assignments[0].deviceId, 'high');
  assert.equal(plan.assignments[0].allocations[0].partId, 'owned');
  const times = batch([device('one')], [part('slow', { harvestMinutes: 5 }), part('quick')]);
  assert.equal(planRecovery(times, limits).assignments[0].allocations[0].partId, 'quick');
});

test('schema rejects unsafe inventory ambiguity, duplicate IDs, malformed imports, and oversized batches', () => {
  const valid = batch([device('one')], [part('ram')]);
  assert.equal(recoveryBatchSchema.safeParse(valid).success, true);
  for (const input of [
    { ...valid, parts: [part('ram'), part('ram')] },
    { ...valid, parts: [part('ram', { evidenceId: 'missing' })] },
    { ...valid, parts: [part('ram', { quantity: -1 })] },
    { ...valid, parts: [part('ram', { source: 'donor', donorId: 'one' })] },
    { ...valid, parts: [part('ram', { source: 'donor' })] },
    { ...valid, devices: [device('one', { eligible: false })] },
    { ...valid, devices: Array.from({ length: 19 }, (_, i) => device(`device-${i}`)) },
    { ...valid, unexpected: 'must be rejected' },
  ]) assert.equal(recoveryBatchSchema.safeParse(input).success, false);
  assert.equal(recoveryLimitsSchema.safeParse({ ...limits, budgetCents: 0.5 }).success, false);
  assert.throws(() => planRecovery(valid, { ...limits, unavailablePartIds: ['nonexistent'] }), RangeError);
});

/** Independent exhaustive unit-by-unit oracle for small fixtures. */
function referenceObjective(input: RecoveryBatch, constraints: RecoveryLimits): number[] {
  const inventory = input.parts.map(item => item.verified && !constraints.unavailablePartIds.includes(item.id) ? item.quantity : 0);
  let best = [0, 0, 0, 0];
  const better = (candidate: number[]) => candidate.some((value, index) => value !== best[index] && candidate.slice(0, index).every((previous, i) => previous === best[i]) && value > best[index]);
  const visit = (index: number, count: number, priority: number, cash: number, time: number) => {
    const value = [count, priority, -cash || 0, -time || 0];
    if (better(value)) best = value;
    if (index === input.devices.length) return;
    const candidate = input.devices[index];
    visit(index + 1, count, priority, cash, time);
    if (!candidate.eligible) return;
    const units = (neededIndex: number, extraCost: number, extraTime: number) => {
      if (cash + extraCost > constraints.budgetCents || time + extraTime > constraints.technicianMinutes) return;
      if (neededIndex === candidate.needs.length) { visit(index + 1, count + 1, priority + candidate.priority, cash + extraCost, time + extraTime); return; }
      input.parts.forEach((row, partIndex) => {
        if (inventory[partIndex] && row.sku === candidate.needs[neededIndex]) {
          inventory[partIndex] -= 1;
          units(neededIndex + 1, extraCost + row.costCents, extraTime + row.harvestMinutes);
          inventory[partIndex] += 1;
        }
      });
    };
    units(0, 0, candidate.repairMinutes);
  };
  visit(0, 0, 0, 0, 0);
  return best;
}

test('exact search agrees with an independent brute-force oracle on varied small batches', () => {
  for (let seed = 0; seed < 24; seed += 1) {
    const input = batch([
      device('a', { needs: ['RAM', 'SSD'], repairMinutes: 5 + seed % 3, priority: seed % 5 }),
      device('b', { repairMinutes: 4, priority: 2 }),
      device('c', { needs: ['SSD'], repairMinutes: 6, priority: 3 }),
      device('d', { needs: seed % 2 ? ['RAM', 'RAM'] : ['RAM'], repairMinutes: 3, priority: 1 }),
    ], [part('ram-free', { quantity: seed % 3, harvestMinutes: seed % 4 }),
      part('ram-buy', { quantity: 2, source: 'purchase', costCents: 100 }),
      part('ssd', { sku: 'SSD', quantity: 1 + seed % 2, costCents: 50, harvestMinutes: 2 })]);
    const constraints = { ...limits, budgetCents: seed % 4 * 100, technicianMinutes: 8 + seed % 5 * 5 };
    const plan = planRecovery(input, constraints);
    const priority = plan.assignments.reduce((sum, assignment) => sum + input.devices.find(item => item.id === assignment.deviceId)!.priority, 0);
    assert.equal(plan.optimal, true);
    assert.deepEqual([plan.summary.recovered, priority, -plan.summary.costCents || 0, -plan.summary.minutes || 0], referenceObjective(input, constraints), `seed ${seed}`);
    assertFeasible(input, constraints, plan);
  }
});

test('bounded search retains a feasible proposal and explicitly refuses an optimality claim', () => {
  const input = batch(Array.from({ length: 10 }, (_, index) => device(`device-${index}`)),
    Array.from({ length: 10 }, (_, index) => part(`part-${index}`)));
  const plan = planRecovery(input, limits);
  assert.equal(plan.optimal, false);
  assert.equal(plan.exploredStates, RECOVERY_SEARCH_LIMIT);
  assert.match(plan.warnings.join(' '), /optimality is not established/);
  assertFeasible(input, limits, plan);
});
