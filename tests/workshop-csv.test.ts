import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWorkshopCsv, devicesCsvTemplate, partsCsvTemplate } from '../src/workshop-csv';
import { planRecovery } from '../lib/recovery';

const identity = { id: 'csv-test', name: 'CSV import verification' };
const parse = (devices = devicesCsvTemplate, parts = partsCsvTemplate) => parseWorkshopCsv(devices, parts, identity);

test('CSV templates form a valid bounded batch and preserve an identity hold', () => {
  const batch = parse();
  assert.equal(batch.devices.length, 2);
  assert.equal(batch.parts.length, 2);
  assert.equal(batch.devices[1].eligible, false);
  assert.equal(batch.parts[1].verified, false);
  assert.equal(planRecovery(batch, { budgetCents: 0, technicianMinutes: 60, unavailablePartIds: [] }).summary.recovered, 1);
});

test('CSV handles BOM, quoted commas, escaped quotes, and multiline notes', () => {
  const source = '\uFEFF' + devicesCsvTemplate.replace('Example laptop A', '"Laptop, room ""A"""').replace('Synthetic template row. Replace with diagnosed records.', '"First line\nSecond line"');
  const batch = parse(source);
  assert.equal(batch.devices[0].label, 'Laptop, room "A"');
  assert.equal(batch.devices[0].intakeNote, 'First line\nSecond line');
});

test('CSV reports duplicate columns, mismatched widths and malformed quoting', () => {
  assert.throws(() => parse(devicesCsvTemplate.replace('id,label,', 'id,id,')), /duplicate column/);
  assert.throws(() => parse(devicesCsvTemplate.replace('Example laptop A', 'Laptop, A')), /expected 9 columns/);
  assert.throws(() => parse(devicesCsvTemplate + '"unfinished'), /closing quote/);
  assert.throws(() => parse(devicesCsvTemplate.replace('Example laptop A', '"Laptop"extra')), /unexpected text/);
});

test('CSV never promotes missing eligibility or verification into approval', () => {
  const batch = parse(devicesCsvTemplate.replace(',true,,', ',,,'), partsCsvTemplate.replace(',true,Synthetic', ',,Synthetic'));
  assert.equal(batch.devices[0].eligible, false);
  assert.match(batch.devices[0].holdReason!, /not been confirmed/);
  assert.equal(batch.parts[0].verified, false);
  assert.equal(batch.devices.every(device => device.qaRequired), true);
  assert.throws(() => parse(undefined, partsCsvTemplate.replace('Synthetic declaration only. Replace with exact compatibility and condition evidence.', '')), /require an evidence_detail/);
});

test('CSV rejects a device declared eligible while an unresolved hold remains', () => {
  assert.throws(() => parse(devicesCsvTemplate.replace(',true,,', ',true,Ownership unresolved,')), /unresolved hold cannot be eligible/);
});

test('CSV money is exact cents and invalid numerical or logical inputs are rejected', () => {
  const batch = parse(undefined, partsCsvTemplate.replace(',1,0,0,true,', ',1,12.50,0,true,'));
  assert.equal(batch.parts[0].costCents, 1250);
  for (const amount of ['1.001', '-1', 'NaN', '$20', '1e3']) assert.throws(() => parse(undefined, partsCsvTemplate.replace(',1,0,0,true,', `,1,${amount},0,true,`)), /USD amount/);
  assert.throws(() => parse(devicesCsvTemplate.replace(',20,5,true,', ',20min,5,true,')), /whole number/);
  assert.throws(() => parse(undefined, partsCsvTemplate.replace(',true,Synthetic', ',maybe,Synthetic')), /true or false/);
});

test('CSV enforces inventory identities, donor separation, SKU quantities and batch bounds', () => {
  const batch = parse(devicesCsvTemplate.replace('RAM-DEMO-8,20', 'RAM-DEMO-8|RAM-DEMO-8,20'));
  assert.equal(batch.devices[0].needs.length, 2);
  assert.equal(planRecovery(batch, { budgetCents: 0, technicianMinutes: 60, unavailablePartIds: [] }).summary.recovered, 0);
  assert.throws(() => parse(undefined, partsCsvTemplate.replace('P-002,', 'P-001,')), /Duplicate/);
  assert.throws(() => parse(undefined, partsCsvTemplate.replace('donor,D-001', 'donor,L-001')), /donor device cannot also/);
  assert.throws(() => parse('x'.repeat(100_001)), /100 KB/);
});
