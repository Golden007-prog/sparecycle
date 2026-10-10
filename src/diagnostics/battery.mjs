// Deliberately faulty, synthetic Review demonstration. Not imported by the app.
// The controlled fix belongs in a draft PR and must leave the tests unchanged.
export function parseBatteryLog(line) {
  const match = /^BATTERY level=(\d+)% status=(charging|discharging|full)$/.exec(line.trim());
  if (!match) return null;
  const percentage = Number(match[1]);
  if (!percentage || percentage > 100) return null;
  return { percentage, state: match[2] };
}
