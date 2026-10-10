import { z } from 'zod';
import { ReviewEngineError, allowedTestPath, sha256, validateCandidate, validateSnapshot, type CandidatePatch, type EngineEnvironment, type RepositorySnapshot, type VerificationProof } from './github.js';

const BASE = 'https://api.tokenfactory.nebius.com/sandboxes/v1';
const uuid = z.string().uuid();
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const stream = z.object({ value: z.string().max(90_000), encoding: z.enum(['ascii', 'base64', 'utf-8', 'utf8']), truncated: z.boolean().optional() });
export interface SandboxReceipt {
  operationId: string; imageId: string; snapshotHash: string; candidateHash: string | null; evidenceHash: string;
  files: Record<string, { uuid: string; sha256: string }>; testPaths: string[]; startedAt: string;
}
export interface SandboxResult {
  status: 'pending' | 'passed' | 'failed' | 'error'; operationId: string; passed: number; failed: number;
  exitCode: number | null; networkDisabled: boolean; outputHash?: string; message: string;
  testNamesHash?: string;
}
export interface SandboxOptions { fetch?: typeof fetch; now?: () => number }
function decode(value: z.infer<typeof stream>): string {
  if (value.truncated) throw new ReviewEngineError('SANDBOX_OUTPUT_TRUNCATED', 'The test output was truncated; verification is incomplete.', 409);
  return value.encoding === 'base64' ? Buffer.from(value.value, 'base64').toString('utf8') : value.value;
}
export function parseTestSummary(stdout: string, exitCode: number): { passed: number; failed: number; testNamesHash: string } {
  const read = (key: string): number => {
    const found = [...stdout.matchAll(new RegExp(`^# ${key} (\\d+)\\s*$`, 'gm'))];
    if (found.length !== 1) throw new ReviewEngineError('SANDBOX_TESTS_UNVERIFIED', 'The test runner did not return one complete TAP summary.', 409);
    return Number(found[0][1]);
  };
  const tests = read('tests'); const passed = read('pass'); const failed = read('fail');
  const cancelled = read('cancelled'); const skipped = read('skipped'); const todo = read('todo');
  if (!Number.isSafeInteger(tests) || tests < 1 || tests > 1000 || cancelled || skipped || todo || passed + failed !== tests || (exitCode === 0) !== (failed === 0) || ![0, 1].includes(exitCode)) throw new ReviewEngineError('SANDBOX_TESTS_UNVERIFIED', 'The test run was empty, skipped, interrupted, or inconsistent.', 409);
  const names = [...stdout.matchAll(/^( *)# Subtest: (.+)$/gm)].map(match => `${match[1].length}:${match[2]}`);
  if (names.length < tests || names.length > 2000 || names.some(name => name.length > 1000)) throw new ReviewEngineError('SANDBOX_TESTS_UNVERIFIED', 'The test runner did not report complete test identities.', 409);
  return { passed, failed, testNamesHash: sha256(JSON.stringify(names)) };
}
export function buildVerificationProof(snapshot: RepositorySnapshot, candidate: CandidatePatch, baselineReceipt: SandboxReceipt, baseline: SandboxResult, candidateReceipt: SandboxReceipt, result: SandboxResult, now = Date.now()): VerificationProof {
  validateCandidate(snapshot, candidate);
  if (baselineReceipt.candidateHash !== null || baselineReceipt.snapshotHash !== snapshot.hash || candidateReceipt.snapshotHash !== snapshot.hash || candidateReceipt.candidateHash !== candidate.hash || baselineReceipt.evidenceHash !== candidate.evidenceHash || candidateReceipt.evidenceHash !== candidate.evidenceHash || baselineReceipt.imageId !== candidateReceipt.imageId || baselineReceipt.operationId !== baseline.operationId || candidateReceipt.operationId !== result.operationId || baseline.operationId === result.operationId || baseline.status !== 'failed' || baseline.failed < 1 || result.status !== 'passed' || result.failed !== 0 || result.passed !== baseline.passed + baseline.failed || !hash.safeParse(baseline.testNamesHash).success || baseline.testNamesHash !== result.testNamesHash || !baseline.networkDisabled || !result.networkDisabled) throw new ReviewEngineError('VERIFICATION_REQUIRED', 'The baseline and candidate results do not prove the same named failing tests now pass.', 409);
  return { snapshotHash: snapshot.hash, candidateHash: candidate.hash, evidenceHash: candidate.evidenceHash, imageId: baselineReceipt.imageId, baselineOperationId: baseline.operationId, candidateOperationId: result.operationId, baselineFailed: baseline.failed, baselinePassed: baseline.passed, candidatePassed: result.passed, candidateFailed: 0, testNamesHash: baseline.testNamesHash!, networkDisabled: true, completedAt: new Date(now).toISOString() };
}
export function createNebiusSandbox(env: EngineEnvironment = process.env, options: SandboxOptions = {}) {
  const fetcher = options.fetch ?? fetch;
  const configured = () => {
    if (!env.NEBIUS_API_KEY || !env.NEBIUS_PROJECT_ID) throw new ReviewEngineError('SANDBOX_NOT_CONFIGURED', 'Configure the Nebius project ID and activate Sandboxes before running repository tests.', 503);
  };
  const request = async (path: string, method = 'GET', body?: string, binary = false): Promise<any> => {
    configured(); let response: Response;
    try { response = await fetcher(`${BASE}${path}`, { method, redirect: 'error', signal: AbortSignal.timeout(12_000), headers: { Authorization: `Bearer ${env.NEBIUS_API_KEY}`, Project: env.NEBIUS_PROJECT_ID!, ...(body === undefined ? {} : { 'Content-Type': binary ? 'application/octet-stream' : 'application/json' }) }, ...(body === undefined ? {} : { body }) }); }
    catch { throw new ReviewEngineError(method === 'POST' ? 'SANDBOX_SUBMISSION_UNCERTAIN' : 'SANDBOX_UNAVAILABLE', method === 'POST' ? 'Nebius may have accepted this submission. Inspect operations before retrying.' : 'Nebius Sandbox status is temporarily unavailable.', 502); }
    if (!response.ok) throw new ReviewEngineError(response.status === 403 ? 'SANDBOX_ACCESS_REQUIRED' : 'SANDBOX_REQUEST_FAILED', response.status === 403 ? 'This Nebius project or API key does not have Sandbox access. Activation and authorization must be checked.' : 'Nebius Sandboxes rejected the request.', response.status === 403 ? 503 : 502);
    if (method === 'DELETE' && response.status === 202) return {};
    if (method === 'POST' && response.status !== 201) throw new ReviewEngineError('SANDBOX_RESPONSE_INVALID', 'Nebius did not confirm creation of the requested resource.', 502);
    const text = await response.text();
    if (text.length > 300_000) throw new ReviewEngineError('SANDBOX_RESPONSE_INVALID', 'Nebius returned an oversized response.', 502);
    try { return JSON.parse(text); } catch { throw new ReviewEngineError('SANDBOX_RESPONSE_INVALID', 'Nebius returned an invalid response.', 502); }
  };
  return {
    async cancelVerification(receipt: SandboxReceipt): Promise<{ accepted: true }> {
      // Receipt ownership must be checked by the job store before calling this method.
      if (!uuid.safeParse(receipt.operationId).success) throw new ReviewEngineError('INVALID_OPERATION', 'Invalid sandbox receipt.');
      await request(`/operations/${receipt.operationId}`, 'DELETE'); return { accepted: true };
    },
    async probe(): Promise<{ available: true; imageConfigured: boolean; images: Array<{ uuid: string; tag: string | null }> }> {
      const response = await request('/images');
      const parsed = z.object({ images: z.array(z.object({ uuid, tag: z.string().nullable().optional() })).max(5000) }).safeParse(response);
      if (!parsed.success) throw new ReviewEngineError('SANDBOX_RESPONSE_INVALID', 'Nebius did not return a valid image catalog.', 502);
      return { available: true, imageConfigured: uuid.safeParse(env.NEBIUS_SANDBOX_IMAGE_ID).success, images: parsed.data.images.map(i => ({ uuid: i.uuid, tag: i.tag ?? null })) };
    },
    async startVerification(input: { snapshot: RepositorySnapshot; evidenceHash: string; candidate?: CandidatePatch }): Promise<SandboxReceipt> {
      configured(); validateSnapshot(input.snapshot);
      const image = uuid.safeParse(env.NEBIUS_SANDBOX_IMAGE_ID);
      if (!image.success) throw new ReviewEngineError('SANDBOX_IMAGE_REQUIRED', 'Pin an immutable Nebius image UUID containing Node.js 22 or later.', 503);
      if (!hash.safeParse(input.evidenceHash).success) throw new ReviewEngineError('INVALID_EVIDENCE', 'A versioned evidence hash is required.');
      if (input.candidate) {
        validateCandidate(input.snapshot, input.candidate);
        if (input.candidate.evidenceHash !== input.evidenceHash) throw new ReviewEngineError('STALE_EVIDENCE', 'The evidence changed after patch generation.', 409);
      }
      const files: SandboxReceipt['files'] = {};
      await Promise.all(input.snapshot.files.map(async file => {
        const content = input.candidate?.path === file.path ? input.candidate.content : file.content;
        const uploaded = z.object({ uuid, sha256: hash, size: z.number().int() }).safeParse(await request('/files', 'POST', content, true));
        if (!uploaded.success || uploaded.data.sha256 !== sha256(content) || uploaded.data.size !== Buffer.byteLength(content)) throw new ReviewEngineError('SANDBOX_UPLOAD_INVALID', 'An uploaded file failed integrity checks.', 502);
        files[`/workspace/${file.path}`] = { uuid: uploaded.data.uuid, sha256: uploaded.data.sha256 };
      }));
      const testPaths = input.snapshot.files.filter(f => allowedTestPath(f.path)).map(f => f.path).sort();
      const body = {
        image: image.data, command: '/usr/local/bin/node', args: ['--test', '--test-reporter=tap', ...testPaths], shell: false,
        cwd: '/workspace', env: { PATH: '/usr/local/bin:/usr/bin:/bin', NODE_NO_WARNINGS: '1' },
        uid: 1000, gid: 1000, preserve_env: false, disposable: true, networking: { enabled: false },
        timeout: 30, truncate_output_at: 65_536, resources_limits: { max_layer_bytes: 67_108_864 },
        files: Object.fromEntries(Object.entries(files).map(([path, file]) => [path, { uuid: file.uuid, uid: 0, gid: 0, mode: '0444' }])),
      };
      const spawned = z.object({ uuid }).safeParse(await request('/instances', 'POST', JSON.stringify(body)));
      if (!spawned.success) throw new ReviewEngineError('SANDBOX_RESPONSE_INVALID', 'Nebius did not return an operation ID.', 502);
      return { operationId: spawned.data.uuid, imageId: image.data, snapshotHash: input.snapshot.hash, candidateHash: input.candidate?.hash ?? null, evidenceHash: input.evidenceHash, files, testPaths, startedAt: new Date((options.now ?? Date.now)()).toISOString() };
    },
    async pollVerification(receipt: SandboxReceipt): Promise<SandboxResult> {
      if (!uuid.safeParse(receipt.operationId).success || !uuid.safeParse(receipt.imageId).success) throw new ReviewEngineError('INVALID_OPERATION', 'Invalid sandbox receipt.');
      const operation = await request(`/operations/${receipt.operationId}`);
      if (operation.uuid !== receipt.operationId || operation.kind !== 'instance' || !['PENDING', 'ASSIGNED', 'EXECUTING', 'SUCCESS', 'FAILED', 'CANCELLED'].includes(operation.status)) throw new ReviewEngineError('SANDBOX_RESPONSE_INVALID', 'Nebius returned an unexpected operation.', 502);
      const result: SandboxResult = { status: 'pending', operationId: receipt.operationId, passed: 0, failed: 0, exitCode: null, networkDisabled: false, message: 'Tests are still running in Nebius.' };
      if (['PENDING', 'ASSIGNED', 'EXECUTING'].includes(operation.status)) return result;
      if (operation.status !== 'SUCCESS') return { ...result, status: 'error', message: 'Nebius could not complete this operation. No test result was accepted.' };
      const metadata = operation.metadata;
      const expectedArgs = ['--test', '--test-reporter=tap', ...receipt.testPaths];
      const expectedPaths = Object.keys(receipt.files).sort();
      if (operation.image_uuid !== receipt.imageId || metadata?.image !== receipt.imageId || metadata?.networking?.enabled !== false || metadata?.disposable !== true || metadata?.shell !== false || metadata?.command !== '/usr/local/bin/node' || metadata?.cwd !== '/workspace' || metadata?.uid !== 1000 || metadata?.gid !== 1000 || metadata?.preserve_env !== false || operation.result_image_uuid || JSON.stringify(metadata?.args) !== JSON.stringify(expectedArgs) || JSON.stringify(Object.keys(metadata?.files ?? {}).sort()) !== JSON.stringify(expectedPaths) || expectedPaths.some(path => metadata.files[path]?.uuid !== receipt.files[path].uuid || metadata.files[path]?.mode !== '0444')) throw new ReviewEngineError('SANDBOX_PROVENANCE_INVALID', 'The sandbox operation does not match the pinned, network-disabled verification request.', 409);
      const parsed = z.object({ state: z.object({ exit_code: z.number().int(), signal: z.number().nullable().optional(), timed_out: z.boolean().optional() }), stdout: stream, stderr: stream }).safeParse(metadata.result);
      if (!parsed.success || parsed.data.state.timed_out || ![undefined, null, -1, 0].includes(parsed.data.state.signal)) return { ...result, status: 'error', message: 'The test process was interrupted or did not produce a complete result.' };
      const stdout = decode(parsed.data.stdout); decode(parsed.data.stderr);
      const counts = parseTestSummary(stdout, parsed.data.state.exit_code);
      return { ...result, ...counts, status: counts.failed ? 'failed' : 'passed', exitCode: parsed.data.state.exit_code, networkDisabled: true, outputHash: sha256(stdout), message: counts.failed ? `${counts.failed} diagnostic tests failed.` : `${counts.passed} diagnostic tests passed.` };
    },
  };
}
