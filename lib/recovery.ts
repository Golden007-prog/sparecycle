import { recoveryBatchSchema, recoveryLimitsSchema } from './recovery-types.js';
import type { PartAllocation, RecoveryAssignment, RecoveryBatch, RecoveryDevice, RecoveryLimits, RecoveryPart, RecoveryPlan, RecoverySummary } from './recovery-types.js';

export const RECOVERY_SEARCH_LIMIT = 200_000;

function requirements(device: RecoveryDevice): [string, number][] {
  const counts = new Map<string, number>();
  for (const sku of device.needs) counts.set(sku, (counts.get(sku) ?? 0) + 1);
  return [...counts].sort(([a], [b]) => a.localeCompare(b));
}

function summarize(assignments: RecoveryAssignment[], parts: RecoveryPart[]): RecoverySummary {
  const partById = new Map(parts.map(part => [part.id, part]));
  return {
    recovered: assignments.length,
    costCents: assignments.reduce((sum, assignment) => sum + assignment.costCents, 0),
    minutes: assignments.reduce((sum, assignment) => sum + assignment.minutes, 0),
    reusedParts: assignments.reduce((sum, assignment) => sum + assignment.allocations.reduce((units, allocation) =>
      units + (partById.get(allocation.partId)?.source !== 'purchase' ? allocation.quantity : 0), 0), 0),
  };
}

/**
 * Deterministic intake-order baseline: lowest-cash available parts first, then least
 * preparation time. A complete device is admitted only if it fits remaining limits.
 * This benchmark is a defined heuristic, not measured human operator performance.
 */
function greedyPlan(batch: RecoveryBatch, limits: RecoveryLimits, initialStock: number[]): RecoveryAssignment[] {
  const stock = [...initialStock];
  const chosen: RecoveryAssignment[] = [];
  let cash = 0;
  let time = 0;
  for (const device of batch.devices) {
    if (!device.eligible) continue;
    const allocations: PartAllocation[] = [];
    let costCents = 0;
    let minutes = device.repairMinutes;
    let complete = true;
    for (const [sku, required] of requirements(device)) {
      let needed = required;
      const candidates = batch.parts.map((part, index) => ({ part, index }))
        .filter(({ part, index }) => part.sku === sku && stock[index] > 0)
        .sort((a, b) => a.part.costCents - b.part.costCents || a.part.harvestMinutes - b.part.harvestMinutes || a.part.id.localeCompare(b.part.id));
      for (const { part, index } of candidates) {
        const quantity = Math.min(stock[index], needed);
        if (!quantity) continue;
        allocations.push({ partId: part.id, sku, quantity });
        costCents += part.costCents * quantity;
        minutes += part.harvestMinutes * quantity;
        needed -= quantity;
        if (!needed) break;
      }
      if (needed) { complete = false; break; }
    }
    if (!complete || cash + costCents > limits.budgetCents || time + minutes > limits.technicianMinutes) continue;
    for (const allocation of allocations) stock[batch.parts.findIndex(part => part.id === allocation.partId)] -= allocation.quantity;
    chosen.push({ deviceId: device.id, allocations, costCents, minutes });
    cash += costCents;
    time += minutes;
  }
  return chosen;
}

/**
 * Search complete-device selections and exact-SKU inventory allocations jointly.
 * Objective, in order: more devices; greater summed priority; lower cash; less time.
 * Each part unit is consumed once. Donors are inventory sources, never candidates.
 * All reported recovery counts are proposed work, pending repair and final QA.
 */
export function planRecovery(batchInput: RecoveryBatch, limitsInput: RecoveryLimits): RecoveryPlan {
  const batch = recoveryBatchSchema.parse(batchInput);
  const limits = recoveryLimitsSchema.parse(limitsInput);
  const knownPartIds = new Set(batch.parts.map(part => part.id));
  const unknown = limits.unavailablePartIds.filter(id => !knownPartIds.has(id));
  if (unknown.length) throw new RangeError(`Unavailable part identifiers are not in this batch: ${unknown.join(', ')}`);
  const unavailable = new Set(limits.unavailablePartIds);
  const initialStock = batch.parts.map(part => part.verified && !unavailable.has(part.id) ? part.quantity : 0);
  const bySku = new Map<string, number[]>();
  batch.parts.forEach((part, index) => {
    if (initialStock[index]) bySku.set(part.sku, [...(bySku.get(part.sku) ?? []), index]);
  });
  for (const indices of bySku.values()) indices.sort((a, b) => batch.parts[a].costCents - batch.parts[b].costCents ||
    batch.parts[a].harvestMinutes - batch.parts[b].harvestMinutes || batch.parts[a].id.localeCompare(batch.parts[b].id));
  const baselineAssignments = greedyPlan(batch, limits, initialStock);
  const deviceById = new Map(batch.devices.map(device => [device.id, device]));
  const priorityOf = (assignments: RecoveryAssignment[]) => assignments.reduce((sum, item) => sum + deviceById.get(item.deviceId)!.priority, 0);
  const signature = (assignments: RecoveryAssignment[]) => assignments.map(item => `${item.deviceId}:${item.allocations.map(part => `${part.partId}=${part.quantity}`).sort().join(',')}`).sort().join('|');
  let best = baselineAssignments;
  let bestSummary = summarize(best, batch.parts);
  let bestPriority = priorityOf(best);
  let exploredStates = 0;
  let capped = false;
  const tick = () => {
    if (exploredStates >= RECOVERY_SEARCH_LIMIT) { capped = true; return false; }
    exploredStates += 1;
    return true;
  };
  const consider = (selected: RecoveryAssignment[], priority: number, cash: number, time: number) => {
    const better = selected.length > best.length || (selected.length === best.length &&
      (priority > bestPriority || (priority === bestPriority && (cash < bestSummary.costCents ||
        (cash === bestSummary.costCents && (time < bestSummary.minutes ||
          (time === bestSummary.minutes && signature(selected) < signature(best))))))));
    if (better) {
      best = selected.map(item => ({ ...item, allocations: item.allocations.map(allocation => ({ ...allocation })) }));
      bestSummary = summarize(best, batch.parts);
      bestPriority = priority;
    }
  };
  const eligible = batch.devices.filter(device => device.eligible);
  // Try shorter jobs first to establish a useful lower bound early. Exhaustive
  // search still explores other allocations and every allowed subset if uncapped.
  const order = [...eligible].sort((a, b) => a.repairMinutes - b.repairMinutes || b.priority - a.priority || a.id.localeCompare(b.id));
  const stock = [...initialStock];
  const selected: RecoveryAssignment[] = [];
  const search = (deviceIndex: number, priority: number, cash: number, time: number) => {
    if (!tick()) return;
    consider(selected, priority, cash, time);
    const remainingDevices = order.length - deviceIndex;
    if (!remainingDevices || selected.length + remainingDevices < best.length) return;
    const remainingPriority = order.slice(deviceIndex).reduce((sum, device) => sum + device.priority, 0);
    if (selected.length + remainingDevices === best.length && priority + remainingPriority < bestPriority) return;
    const device = order[deviceIndex];
    if (time + device.repairMinutes <= limits.technicianMinutes) {
      const needs = requirements(device);
      const allocations: PartAllocation[] = [];
      const allocateSku = (needIndex: number, deviceCost: number, deviceMinutes: number) => {
        if (!tick() || cash + deviceCost > limits.budgetCents || time + deviceMinutes > limits.technicianMinutes) return;
        if (needIndex === needs.length) {
          selected.push({ deviceId: device.id, allocations: [...allocations], costCents: deviceCost, minutes: deviceMinutes });
          search(deviceIndex + 1, priority + device.priority, cash + deviceCost, time + deviceMinutes);
          selected.pop();
          return;
        }
        const [sku, quantityNeeded] = needs[needIndex];
        const indices = bySku.get(sku) ?? [];
        const takeFromRow = (rowIndex: number, stillNeeded: number, partCost: number, partMinutes: number) => {
          if (!tick() || capped || cash + deviceCost + partCost > limits.budgetCents || time + deviceMinutes + partMinutes > limits.technicianMinutes) return;
          if (!stillNeeded) { allocateSku(needIndex + 1, deviceCost + partCost, deviceMinutes + partMinutes); return; }
          if (rowIndex === indices.length || indices.slice(rowIndex).reduce((sum, index) => sum + stock[index], 0) < stillNeeded) return;
          const index = indices[rowIndex];
          const part = batch.parts[index];
          const maximum = Math.min(stock[index], stillNeeded);
          for (let quantity = maximum; quantity >= 0; quantity -= 1) {
            stock[index] -= quantity;
            if (quantity) allocations.push({ partId: part.id, sku, quantity });
            takeFromRow(rowIndex + 1, stillNeeded - quantity, partCost + quantity * part.costCents, partMinutes + quantity * part.harvestMinutes);
            if (quantity) allocations.pop();
            stock[index] += quantity;
            if (capped) return;
          }
        };
        takeFromRow(0, quantityNeeded, 0, 0);
      };
      allocateSku(0, 0, device.repairMinutes);
    }
    if (!capped) search(deviceIndex + 1, priority, cash, time);
  };
  search(0, 0, 0, 0);
  const chosenIds = new Set(best.map(item => item.deviceId));
  const allocated = new Map<string, number>();
  for (const assignment of best) for (const allocation of assignment.allocations) {
    allocated.set(allocation.partId, (allocated.get(allocation.partId) ?? 0) + allocation.quantity);
  }
  const unresolved = batch.devices.filter(device => !chosenIds.has(device.id)).map(device => {
    const reasons: string[] = [];
    if (!device.eligible) reasons.push(device.holdReason ?? 'Device is on hold pending technician review.');
    else {
      for (const [sku, quantity] of requirements(device)) {
        const rows = batch.parts.filter(part => part.sku === sku);
        const valid = rows.filter(part => part.verified && !unavailable.has(part.id));
        const initialQuantity = valid.reduce((sum, part) => sum + part.quantity, 0);
        const remainingQuantity = valid.reduce((sum, part) => sum + part.quantity - (allocated.get(part.id) ?? 0), 0);
        if (!rows.length) reasons.push(`No inventory has the exact approved SKU ${sku}; similar specifications are not compatibility evidence.`);
        else if (initialQuantity < quantity) {
          reasons.push(`${sku}: needs ${quantity}, but only ${initialQuantity} verified available units exist${rows.some(part => unavailable.has(part.id)) ? '; failed or withdrawn stock is excluded' : ''}${rows.some(part => !part.verified) ? '; unverified stock is excluded' : ''}.`);
        } else if (remainingQuantity < quantity) reasons.push(`${sku}: verified units are reserved for other proposed repairs; no unit can be allocated twice.`);
      }
      if (device.repairMinutes > limits.technicianMinutes - bestSummary.minutes) reasons.push(`The remaining ${limits.technicianMinutes - bestSummary.minutes} technician minutes do not cover this device's ${device.repairMinutes}-minute repair, before part preparation.`);
      if (!reasons.length) reasons.push(capped ? 'Not selected by the bounded search; another feasible allocation may exist.' : 'Not selected under the shared inventory, cash, and technician-time limits using the stated recovery-count, priority, cash, then time objective.');
      if (bestSummary.costCents >= limits.budgetCents && device.needs.some(sku => batch.parts.some(part => part.sku === sku && part.source === 'purchase' && part.costCents > 0))) {
        reasons.push('No cash budget remains for additional purchased units.');
      }
    }
    return { deviceId: device.id, reasons };
  });
  const warnings = [
    'Proposed recoveries are work orders, not completed or certified working devices. Technician approval, required data sanitization, and final QA remain necessary.',
    'Compatibility is an exact match to declared approved SKUs. Similar model names, slots, or memory generations are never treated as proof.',
    'The baseline is a defined intake-order heuristic using the same stock and limits; it is not a measured human-performance benchmark.',
    'Donor devices are dedicated part sources and are excluded from repair candidates. Recorded cost is incremental cash; labour is constrained separately in minutes.',
  ];
  if (batch.evidence.some(evidence => evidence.kind === 'demo')) warnings.push('This batch includes synthetic compatibility approvals, inventory, prices, or time estimates. Manufacturer background links do not certify those demo mappings.');
  if (capped) warnings.push(`Search stopped at ${RECOVERY_SEARCH_LIMIT.toLocaleString('en-US')} states. The proposal is feasible, but optimality is not established.`);
  return { assignments: [...best].sort((a, b) => a.deviceId.localeCompare(b.deviceId)), unresolved, summary: bestSummary,
    baseline: summarize(baselineAssignments, batch.parts), optimal: !capped, exploredStates, warnings };
}
