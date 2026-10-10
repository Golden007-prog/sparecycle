import { recoveryBatchSchema, type RecoveryBatch } from '../lib/recovery-types';

export const devicesCsvTemplate = 'id,label,model,needs,repair_minutes,priority,eligible,hold_reason,intake_note\r\n' +
  'L-001,Example laptop A,Example exact model,RAM-DEMO-8,20,5,true,,Synthetic template row. Replace with diagnosed records.\r\n' +
  'L-002,Example laptop B,Example exact model,SSD-DEMO-256,25,5,false,Exact revision not confirmed,Synthetic template row on identity hold.\r\n';
export const partsCsvTemplate = 'id,sku,label,source,donor_id,quantity,cost_usd,prep_minutes,verified,evidence_detail\r\n' +
  'P-001,RAM-DEMO-8,Example tested memory,stock,,1,0,0,true,Synthetic declaration only. Replace with exact compatibility and condition evidence.\r\n' +
  'P-002,SSD-DEMO-256,Example donor storage,donor,D-001,1,0,10,false,Condition and compatibility not yet verified.\r\n';

const deviceFields = ['id', 'label', 'model', 'needs', 'repair_minutes', 'priority', 'eligible', 'hold_reason', 'intake_note'];
const partFields = ['id', 'sku', 'label', 'source', 'donor_id', 'quantity', 'cost_usd', 'prep_minutes', 'verified', 'evidence_detail'];

function csvRows(text: string, label: string): string[][] {
  if (text.length > 100_000) throw new Error(`${label}: keep each CSV below 100 KB.`);
  const source = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false, closedQuote = false;
  const finishField = () => { row.push(field.trim()); field = ''; closedQuote = false; };
  const finishRow = () => { finishField(); if (row.some(value => value !== '')) rows.push(row); row = []; };
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') { field += '"'; i++; }
        else { quoted = false; closedQuote = true; }
      } else field += char;
      continue;
    }
    if (char === ',') { finishField(); continue; }
    if (char === '\n' || char === '\r') { finishRow(); if (char === '\r' && source[i + 1] === '\n') i++; continue; }
    if (closedQuote) {
      if (char === ' ' || char === '\t') continue;
      throw new Error(`${label}: unexpected text after a closing quote near row ${rows.length + 1}.`);
    }
    if (char === '"') {
      if (field.trim()) throw new Error(`${label}: quote the entire field near row ${rows.length + 1}.`);
      field = ''; quoted = true;
    } else field += char;
  }
  if (quoted) throw new Error(`${label}: a quoted field has no closing quote.`);
  if (field || row.length || closedQuote) finishRow();
  return rows;
}

function records(text: string, fields: string[], label: string, limit: number): Record<string, string>[] {
  const rows = csvRows(text, label);
  if (!rows.length) throw new Error(`${label}: paste CSV with the template header row.`);
  const header = rows[0].map(value => value.toLowerCase());
  if (new Set(header).size !== header.length) throw new Error(`${label}: duplicate column names are not allowed.`);
  const missing = fields.filter(field => !header.includes(field));
  const unknown = header.filter(field => !fields.includes(field));
  if (missing.length) throw new Error(`${label}: missing columns ${missing.join(', ')}. Use the comma-separated template.`);
  if (unknown.length) throw new Error(`${label}: unexpected columns ${unknown.join(', ')}.`);
  if (rows.length - 1 > limit) throw new Error(`${label}: this prototype supports at most ${limit} rows per batch.`);
  return rows.slice(1).map((row, index) => {
    if (row.length !== header.length) throw new Error(`${label} row ${index + 2}: expected ${header.length} columns. Put fields containing commas or newlines in double quotes.`);
    return Object.fromEntries(header.map((field, column) => [field, row[column]]));
  });
}

function integer(value: string, name: string, fallback?: number): number {
  if (!value && fallback !== undefined) return fallback;
  if (!/^\d+$/.test(value)) throw new Error(`${name}: enter a whole number, without units.`);
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error(`${name}: number is too large.`);
  return number;
}
function flag(value: string, name: string): boolean {
  if (!value || /^(false|no|0)$/i.test(value)) return false;
  if (/^(true|yes|1)$/i.test(value)) return true;
  throw new Error(`${name}: use true or false.`);
}
function cents(value: string, name: string): number {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) throw new Error(`${name}: enter a USD amount such as 12.50, without a currency symbol.`);
  const [whole, fraction = ''] = value.split('.');
  const total = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(total)) throw new Error(`${name}: amount is too large.`);
  return total;
}

/** Import coordinator declarations only. Catalog specifications never approve a match. */
export function parseWorkshopCsv(devicesCsv: string, partsCsv: string, identity: { id: string; name: string }): RecoveryBatch {
  const devices = records(devicesCsv, deviceFields, 'Devices CSV', 18).map((record, index) => {
    const location = `Devices row ${index + 2}`;
    const eligible = flag(record.eligible, `${location} eligible`);
    return {
      id: record.id, label: record.label, model: record.model,
      needs: record.needs.split('|').map(value => value.trim()).filter(Boolean),
      repairMinutes: integer(record.repair_minutes, `${location} repair_minutes`),
      priority: integer(record.priority, `${location} priority`, 0), eligible,
      ...(!eligible ? { holdReason: record.hold_reason || 'Eligibility has not been confirmed in the imported records.' } : record.hold_reason ? { holdReason: record.hold_reason } : {}),
      intakeNote: record.intake_note, qaRequired: true,
    };
  });
  const sourceRows = records(partsCsv, partFields, 'Parts CSV', 40);
  const parts = sourceRows.map((record, index) => {
    const location = `Parts row ${index + 2}`;
    const verified = flag(record.verified, `${location} verified`);
    if (verified && !record.evidence_detail) throw new Error(`${location}: verified parts require an evidence_detail declaration. A catalog model name is not compatibility evidence.`);
    return {
      id: record.id, sku: record.sku, label: record.label, source: record.source,
      ...(record.donor_id ? { donorId: record.donor_id } : {}),
      quantity: integer(record.quantity, `${location} quantity`),
      costCents: cents(record.cost_usd, `${location} cost_usd`),
      harvestMinutes: integer(record.prep_minutes, `${location} prep_minutes`),
      verified, evidenceId: `csv-evidence-${index + 1}`,
    };
  });
  const evidence = sourceRows.map((record, index) => ({
    id: `csv-evidence-${index + 1}`, title: `Imported declaration: ${record.label}`.slice(0, 160),
    detail: record.evidence_detail || 'No compatibility or condition evidence supplied. This component remains unverified.',
    kind: 'technician' as const,
  }));
  const parsed = recoveryBatchSchema.safeParse({ ...identity, devices, parts, evidence });
  if (!parsed.success) throw new Error(parsed.error.issues.slice(0, 3).map(issue => `${issue.path.join('.')}: ${issue.message}`).join(' • '));
  return parsed.data;
}
