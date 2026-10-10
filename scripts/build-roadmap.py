"""Validate the feature catalog and publish a searchable, static roadmap payload."""
import argparse
import csv
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
with (ROOT / 'docs/feature-catalog.csv').open(encoding='utf-8-sig', newline='') as source:
    rows = list(csv.DictReader(source))
assert len(rows) == 520, 'Expected 520 catalog entries'
assert {r['id'] for r in rows} == {f'SC-{n:04}' for n in range(1, 521)}, 'Feature IDs must be unique and complete'
assert len({r['title'].casefold() for r in rows}) == 520, 'Duplicate feature titles'
assert len({r['user_story'].casefold() for r in rows}) == 520, 'Duplicate user stories'
modules = Counter(r['module_id'] for r in rows)
assert len(modules) == 26 and set(modules.values()) == {20}, 'Expected 26 modules with 20 entries each'
for row in rows:
    assert all(row.values()), f"Missing field in {row['id']}"
    assert row['status'] in ('shipped', 'planned'), 'Unrecognized status'
    assert row['priority'] in ('P0', 'P1', 'P2', 'P3'), 'Unrecognized priority'
    assert row['differentiator_candidate'] in ('true', 'false'), 'Unrecognized differentiation flag'
    row['differentiator_candidate'] = row['differentiator_candidate'] == 'true'
candidates = sum(r['differentiator_candidate'] for r in rows)
assert candidates >= 200, 'Expected at least 200 differentiation candidates'
result = {'version': 1, 'updatedAt': '2026-10-10', 'features': rows}
encoded = json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n'
target = ROOT / 'public/roadmap-data.json'
if args.check:
    assert target.read_text(encoding='utf-8') == encoded, 'Roadmap payload is stale; regenerate it'
else:
    target.write_text(encoded, encoding='utf-8', newline='\n')
print(json.dumps({'features': len(rows), 'modules': len(modules), 'differentiationCandidates': candidates, 'statusCounts': dict(Counter(r['status'] for r in rows)), 'check': args.check}))
