import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWorkOrdersCsv, parseBatch } from '../src/data-io';
import { sampleRecoveryBatch, defaultRecoveryLimits } from '../lib/recovery-data';
import { planRecovery } from '../lib/recovery';

// Independent small RFC-style reader to verify that exported delimiters and
// embedded line breaks remain data rather than becoming additional cells.
function readCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  const csv = text.replace(/^\uFEFF/, '');
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    if (char === '"') {
      if (quoted && csv[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (!quoted && char === ',') { row.push(value); value = ''; }
    else if (!quoted && char === '\r' && csv[index + 1] === '\n') { row.push(value); rows.push(row); row = []; value = ''; index += 1; }
    else value += char;
  }
  assert.equal(quoted, false, 'CSV has an unterminated quoted field');
  row.push(value);
  rows.push(row);
  return rows;
}

test('CSV work orders neutralize formula-like imported labels, models, and hold reasons', () => {
  for (const value of ['=HYPERLINK("https://example.com","open")', '+SUM(1,2)', '-1+2', '@SUM(1,2)', '  =1+1', '\t=1+1', '\r\n=1+1', '＝1+1']) {
    const batch = structuredClone(sampleRecoveryBatch);
    batch.devices.find(item => item.id === 'device-02')!.label = value;
    batch.devices.find(item => item.id === 'device-02')!.model = value;
    batch.devices.find(item => item.id === 'device-08')!.holdReason = value;
    const plan = planRecovery(batch, defaultRecoveryLimits);
    const rows = readCsv(buildWorkOrdersCsv(batch, plan));
    assert.ok(rows.every(row => row.length === 7));
    const proposed = rows.find(row => row[0] === `'${value}`)!;
    assert.ok(proposed, `label formula was not neutralized: ${JSON.stringify(value)}`);
    assert.equal(proposed[1], `'${value}`);
    const held = rows.find(row => row[0] === 'Laptop 08 · identity hold')!;
    assert.equal(held[6], `'${value.trim()}`);
  }
});

test('CSV keeps commas, quotes, Unicode, and embedded line breaks within their original cells', () => {
  const batch = structuredClone(sampleRecoveryBatch);
  batch.devices.find(item => item.id === 'device-02')!.label = 'École, "North"\nLaptop 02';
  const csv = buildWorkOrdersCsv(batch, planRecovery(batch, defaultRecoveryLimits));
  const rows = readCsv(csv);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.equal(rows.length, batch.devices.length + 1);
  assert.ok(rows.every(row => row.length === 7));
  const exported = rows.find(row => row[0].includes('École'))!;
  assert.equal(exported[0], 'École, "North"\nLaptop 02');
  assert.equal(exported[4], '0.00');
});

test('batch import rejects ambiguous references and preserves valid declared records', () => {
  assert.deepEqual(parseBatch(JSON.stringify(sampleRecoveryBatch)), sampleRecoveryBatch);
  const missing = structuredClone(sampleRecoveryBatch);
  missing.parts[0].evidenceId = 'not-in-the-file';
  assert.throws(() => parseBatch(JSON.stringify(missing)), /evidence/);
  const donorCandidate = structuredClone(sampleRecoveryBatch);
  donorCandidate.parts[1].donorId = donorCandidate.devices[0].id;
  assert.throws(() => parseBatch(JSON.stringify(donorCandidate)), /donor device cannot also be a repair candidate/);
  assert.throws(() => parseBatch(' '.repeat(100_001)), /100 KB/);
});
