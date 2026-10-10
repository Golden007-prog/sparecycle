// Trusted runner entry point. Untrusted repository code executes only inside restricted Docker guests.
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { validatePureParser } from './review-parser-policy.mjs';

const parserRoot = process.env.SPARECYCLE_ACORN_ROOT;
if (!parserRoot) throw new Error('The trusted parser dependency is not configured.');
const trustedRequire = createRequire(join(parserRoot, 'package.json'));
const { parse } = trustedRequire('acorn');
if (trustedRequire('acorn/package.json').version !== '8.19.0') throw new Error('Unexpected parser dependency version.');

const digest = value => createHash('sha256').update(value, 'utf8').digest('hex');
const fail = message => { throw new Error(message); };
const sourcePath = value => /^src\/diagnostics\/[A-Za-z0-9_-]+\.mjs$/.test(value);
const testPath = value => /^tests\/diagnostics\/[A-Za-z0-9_-]+\.test\.mjs$/.test(value);
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const payloadEncoded = process.env.REVIEW_PAYLOAD || '';
if (!/^[A-Za-z0-9+/]+={0,2}$/.test(payloadEncoded) || payloadEncoded.length > 60_000) fail('Invalid verification payload.');
const payloadText = Buffer.from(payloadEncoded, 'base64').toString('utf8');
const data = JSON.parse(payloadText);
const { snapshot, candidate, image, nonce, evidenceHash } = data;
if (data.version !== 1 || !/^[a-f0-9]{32}$/.test(nonce) || !hash(evidenceHash) || !/^node:22-alpine@sha256:[a-f0-9]{64}$/.test(image)) fail('Invalid verification identity.');
if (snapshot?.repository?.isPrivate !== false || !/^[a-f0-9]{40}$/.test(snapshot.baseSha) || !/^[a-f0-9]{40}$/.test(snapshot.treeSha) || !sourcePath(snapshot.targetPath) || !Array.isArray(snapshot.files) || snapshot.files.length < 2 || snapshot.files.length > 9) fail('Unsupported public diagnostic snapshot.');
const seen = new Set(); let byteCount = 0;
for (const file of snapshot.files) {
  if (!sourcePath(file.path) && !testPath(file.path)) fail('Unsupported file path.');
  if (seen.has(file.path) || typeof file.content !== 'string' || file.content.includes('\0') || Buffer.byteLength(file.content) > 32_000 || digest(file.content) !== file.sha256 || !/^[a-f0-9]{40}$/.test(file.blobSha)) fail('Invalid snapshot file.');
  seen.add(file.path); byteCount += Buffer.byteLength(file.content);
}
if (byteCount > 40_000 || snapshot.files.filter(f => sourcePath(f.path)).length !== 1 || !seen.has(snapshot.targetPath) || !snapshot.files.some(f => testPath(f.path))) fail('Invalid snapshot scope.');
const actualSnapshotHash = digest(JSON.stringify({ repository: snapshot.repository, baseSha: snapshot.baseSha, treeSha: snapshot.treeSha, targetPath: snapshot.targetPath, files: [...snapshot.files].sort((a, b) => a.path.localeCompare(b.path)).map(f => ({ path: f.path, sha256: f.sha256, blobSha: f.blobSha })) }));
if (actualSnapshotHash !== snapshot.hash || candidate.path !== snapshot.targetPath || candidate.baseSha !== snapshot.baseSha || candidate.snapshotHash !== snapshot.hash || candidate.evidenceHash !== evidenceHash || typeof candidate.content !== 'string' || Buffer.byteLength(candidate.content) > 32_000) fail('Stale candidate.');
const actualCandidateHash = digest(JSON.stringify({ path: candidate.path, content: candidate.content, baseSha: candidate.baseSha, snapshotHash: candidate.snapshotHash, evidenceHash: candidate.evidenceHash }));
if (actualCandidateHash !== candidate.hash) fail('Unsupported candidate.');
validatePureParser(candidate.content, parse);
if (!/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA || '') || !/^\d+$/.test(process.env.GITHUB_RUN_ID || '')) fail('The verifier must run in a pinned GitHub Actions workflow.');

function summary(stdout, exitCode) {
  const read = key => {
    const found = [...stdout.matchAll(new RegExp(`^# ${key} (\\d+)\\s*$`, 'gm'))];
    if (found.length !== 1) fail('Incomplete test summary.');
    return Number(found[0][1]);
  };
  const tests = read('tests'), passed = read('pass'), failed = read('fail');
  if (tests < 1 || tests > 1000 || read('cancelled') || read('skipped') || read('todo') || passed + failed !== tests || ![0, 1].includes(exitCode) || (exitCode === 0) !== (failed === 0)) fail('Incomplete or inconsistent test run.');
  const names = [...stdout.matchAll(/^( *)# Subtest: (.+)$/gm)].map(match => `${match[1].length}:${match[2]}`);
  if (names.length < tests || names.length > 2000 || names.some(name => name.length > 1000)) fail('Incomplete test identities.');
  return { passed, failed, outputHash: digest(stdout), testNamesHash: digest(JSON.stringify(names)) };
}
const work = mkdtempSync(join(tmpdir(), 'sparecycle-review-'));
const runStage = (label, patch) => {
  const dir = join(work, label); mkdirSync(dir, { mode: 0o755 });
  for (const file of snapshot.files) {
    const path = resolve(dir, file.path);
    if (!path.startsWith(dir + '/')) fail('Path containment failed.');
    mkdirSync(resolve(path, '..'), { recursive: true, mode: 0o755 });
    writeFileSync(path, patch && file.path === candidate.path ? candidate.content : file.content, { encoding: 'utf8', mode: 0o444 });
  }
  const containerName = `sparecycle-${nonce}-${label}`;
  const args = ['run', '--rm', '--name', containerName, '--network', 'none', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--read-only', '--pids-limit', '64', '--memory', '256m', '--cpus', '1', '--user', '1000:1000', '--tmpfs', '/tmp:rw,noexec,nosuid,size=16m', '--mount', `type=bind,src=${dir},dst=/workspace,readonly`, '--workdir', '/workspace', '--env', 'NODE_NO_WARNINGS=1', image, '/usr/local/bin/node', '--test', '--test-reporter=tap', ...snapshot.files.filter(f => testPath(f.path)).map(f => f.path).sort()];
  const child = spawnSync('docker', args, { encoding: 'utf8', timeout: 40_000, maxBuffer: 65_536, env: { PATH: process.env.PATH || '/usr/bin:/bin' }, windowsHide: true });
  // Timeout kills the Docker client; explicitly remove only this invocation's uniquely named container.
  spawnSync('docker', ['rm', '-f', containerName], { stdio: 'ignore', timeout: 10_000, env: { PATH: process.env.PATH || '/usr/bin:/bin' }, windowsHide: true });
  if (child.error || child.signal || child.status === null) fail('The isolated test process did not complete.');
  return summary(child.stdout, child.status);
};
try {
  // Pull trusted runtime before starting guests. No repository code runs during image preparation.
  const pull = spawnSync('docker', ['pull', image], { stdio: 'ignore', timeout: 120_000, env: { PATH: process.env.PATH || '/usr/bin:/bin' }, windowsHide: true });
  if (pull.status !== 0 || pull.error) fail('The pinned runtime image could not be prepared.');
  const baseline = runStage('baseline', false); const fixed = runStage('candidate', true);
  if (baseline.failed < 1 || fixed.failed !== 0 || fixed.passed !== baseline.passed + baseline.failed || baseline.testNamesHash !== fixed.testNamesHash) fail('The candidate did not repair the same named failing baseline tests.');
  const proof = {
    version: 1, nonce, payloadHash: digest(payloadText), runnerSha: process.env.GITHUB_SHA, runId: Number(process.env.GITHUB_RUN_ID),
    snapshotHash: snapshot.hash, candidateHash: candidate.hash, evidenceHash, imageId: image,
    baselineOperationId: `github-actions:${process.env.GITHUB_RUN_ID}:baseline`, candidateOperationId: `github-actions:${process.env.GITHUB_RUN_ID}:candidate`,
    baselineFailed: baseline.failed, baselinePassed: baseline.passed, candidatePassed: fixed.passed, candidateFailed: 0,
    testNamesHash: baseline.testNamesHash,
    networkDisabled: true, baselineOutputHash: baseline.outputHash, candidateOutputHash: fixed.outputHash, completedAt: new Date().toISOString(),
  };
  mkdirSync('review-proof', { recursive: true }); writeFileSync('review-proof/proof.json', JSON.stringify(proof), { mode: 0o600 });
  console.log(`Verified ${fixed.passed} tests; baseline failures: ${baseline.failed}. Source and test output are not logged or included in artifacts.`);
} finally {
  // The path was created by mkdtemp under the OS temp directory, never supplied by a payload.
  rmSync(work, { recursive: true, force: true });
}
