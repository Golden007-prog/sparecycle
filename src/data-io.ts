import { recoveryBatchSchema } from '../lib/recovery-types';
import type { RecoveryBatch, RecoveryPlan, RecoveryLimits } from '../lib/recovery-types';

export function download(name: string, content: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function parseBatch(raw: string): RecoveryBatch {
  if (raw.length > 100_000) throw new Error('Keep the batch file below 100 KB.');
  const result = recoveryBatchSchema.safeParse(JSON.parse(raw));
  if (!result.success) throw new Error(result.error.issues.slice(0, 3).map(x => `${x.path.join('.')}: ${x.message}`).join(' • '));
  return result.data;
}
// CSV quoting preserves delimiters; it does not prevent spreadsheet formulas.
// Prefix formula-like imported text before quoting, including whitespace/control
// prefixes and full-width operators that spreadsheet importers may normalize.
const cell = (value: unknown) => {
  const text = String(value ?? '');
  const formulaLike = /^[\s\u0000-\u001f\u007f]*[=+\-@＝＋－＠]/u.test(text) || /^[\t\r\n]/.test(text);
  return `"${(formulaLike ? `'${text}` : text).replaceAll('"', '""')}"`;
};
export function buildWorkOrdersCsv(batch: RecoveryBatch, plan: RecoveryPlan): string {
  const rows = [['Device', 'Model', 'Allocated parts', 'Estimated minutes', 'Parts cost (USD)', 'Status', 'Required checks']];
  for (const job of plan.assignments) {
    const d = batch.devices.find(x => x.id === job.deviceId)!;
    rows.push([d.label, d.model, job.allocations.map(a => `${a.quantity} × ${batch.parts.find(p => p.id === a.partId)?.label} [${a.partId}]`).join('; '), String(job.minutes), (job.costCents / 100).toFixed(2), 'Proposed — technician review', 'Physical compatibility; repair result; data sanitization; supported OS; final quality check']);
  }
  for (const d of plan.unresolved) rows.push([batch.devices.find(x => x.id === d.deviceId)?.label || d.deviceId, '', '', '', '', 'Unresolved', d.reasons.join('; ')]);
  return '\uFEFF' + rows.map(r => r.map(cell).join(',')).join('\r\n');
}
export function exportOrders(batch: RecoveryBatch, plan: RecoveryPlan, _limits: RecoveryLimits) {
  download(`sparecycle-work-orders-${batch.id}.csv`, buildWorkOrdersCsv(batch, plan), 'text/csv;charset=utf-8');
}
