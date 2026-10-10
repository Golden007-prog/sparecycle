import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBatteryLog } from '../../src/diagnostics/battery.mjs';

test('preserves a real zero-percent reading', () => {
  assert.deepEqual(parseBatteryLog('BATTERY level=0% status=discharging'), { percentage: 0, state: 'discharging' });
});
test('reads a normal charging report', () => {
  assert.deepEqual(parseBatteryLog('BATTERY level=67% status=charging'), { percentage: 67, state: 'charging' });
});
test('reads full capacity without changing state', () => {
  assert.deepEqual(parseBatteryLog('BATTERY level=100% status=full'), { percentage: 100, state: 'full' });
});
test('rejects invalid percentages and unsupported input', () => {
  assert.equal(parseBatteryLog('BATTERY level=101% status=charging'), null);
  assert.equal(parseBatteryLog('BATTERY level=-1% status=charging'), null);
  assert.equal(parseBatteryLog('no verified reading'), null);
});
