import { randomBytes } from 'node:crypto';
import { unzipSync } from 'fflate';
import { z } from 'zod';
import { createGitHubAppJwt, ReviewEngineError, sha256, validateCandidate, type CandidatePatch, type EngineEnvironment, type RepositorySnapshot, type VerificationProof } from './github.js';
import { privateKeyFingerprint, sealPrivatePayload } from '../../scripts/review-private-payload.mjs';
import type { RepositoryBinding } from './github.js';

const SHA = /^[a-f0-9]{40}$/;
const IMAGE = /^node:22-alpine@sha256:[a-f0-9]{64}$/;
const WORKFLOW = '.github/workflows/review-verify.yml';
const PRIVATE_WORKFLOW = '.github/workflows/review-private-verify.yml';
const privateBindingSchema = z.object({ organizationId: z.string().uuid(), repository: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/), repositoryId: z.number().int().positive().safe(), installationId: z.number().int().positive().safe(), ref: z.string().regex(/^[A-Za-z0-9_./-]{1,100}$/).refine(value => !value.includes('..') && !value.includes('//')), sha: z.string().regex(SHA), image: z.string().regex(IMAGE), publicKeyPem: z.string().max(10_000).refine(value => value.trim().startsWith('-----BEGIN PUBLIC KEY-----') && !value.includes('PRIVATE KEY')) }).strict();
export type PrivateRunnerBinding = z.infer<typeof privateBindingSchema> & { keyFingerprint: string; bindingHash: string };
export interface ActionsContext { organizationId: string }
function privateBindings(env: EngineEnvironment): PrivateRunnerBinding[] {
  try {
    if (!env.REVIEW_PRIVATE_RUNNERS_JSON) return [];
    if (Buffer.byteLength(env.REVIEW_PRIVATE_RUNNERS_JSON) > 200_000) throw new Error('Configuration too large');
    const bindings = z.array(privateBindingSchema).min(1).max(20).parse(JSON.parse(env.REVIEW_PRIVATE_RUNNERS_JSON));
    if (new Set(bindings.map(binding => `${binding.organizationId}:${binding.repositoryId}`)).size !== bindings.length) throw new Error('Duplicate binding');
    return bindings.map(binding => {
      const keyFingerprint = privateKeyFingerprint(binding.publicKeyPem);
      const bindingHash = sha256(JSON.stringify({ organizationId: binding.organizationId, repository: binding.repository.toLowerCase(), repositoryId: binding.repositoryId, installationId: binding.installationId, ref: binding.ref, sha: binding.sha, image: binding.image, keyFingerprint }));
      return { ...binding, keyFingerprint, bindingHash };
    });
  } catch { throw new ReviewEngineError('PRIVATE_RUNNER_CONFIG_INVALID', 'A private runner binding is invalid. An administrator must review the repository, immutable pin and public key.', 503); }
}
export function privateRunnerConfigured(env: EngineEnvironment = process.env): boolean { try { return privateBindings(env).length > 0; } catch { return false; } }
export function privateRunnerForRepository(env: EngineEnvironment, organizationId: string | undefined, repository: RepositoryBinding): PrivateRunnerBinding | undefined {
  return privateBindings(env).find(item => item.organizationId === organizationId && item.repositoryId === repository.repositoryId && item.installationId === repository.installationId && item.repository.toLowerCase() === `${repository.owner}/${repository.name}`.toLowerCase());
}
export function resolvePrivateRunner(env: EngineEnvironment, organizationId: string | undefined, repository: RepositoryBinding): PrivateRunnerBinding {
  const binding = privateRunnerForRepository(env, organizationId, repository);
  if (!binding || repository.isPrivate !== true) throw new ReviewEngineError('PRIVATE_RUNNER_REQUIRED', 'This private repository needs an administrator-approved verifier in the same repository, bound to this organization and GitHub installation.', 409);
  return binding;
}
export interface ActionsReceipt {
  provider: 'GitHub Actions isolated container'; runId: number; runnerRepository: string; runnerRepositoryId: number;
  runnerSha: string; workflowId: number; nonce: string; payloadHash: string; snapshotHash: string;
  candidateHash: string; evidenceHash: string; imageId: string; startedAt: string;
  executionScope?: 'public-shared' | 'private-repository'; organizationId?: string; runnerInstallationId?: number;
  bindingHash?: string; envelopeHash?: string; keyFingerprint?: string;
}
export interface ActionsOptions { fetch?: typeof fetch; now?: () => number }
export type ActionsPoll = { status: 'pending'; message: string } | { status: 'passed'; proof: VerificationProof; url: string } | { status: 'failed'; message: string; url: string };
const proofSchema = z.object({
  version: z.literal(1), nonce: z.string(), payloadHash: z.string(), runnerSha: z.string(), runId: z.number().int().positive(),
  snapshotHash: z.string(), candidateHash: z.string(), evidenceHash: z.string(), imageId: z.string(),
  baselineOperationId: z.string(), candidateOperationId: z.string(), baselineFailed: z.number().int().min(1).max(1000), baselinePassed: z.number().int().min(0).max(1000), candidatePassed: z.number().int().min(1).max(1000), candidateFailed: z.literal(0),
  networkDisabled: z.literal(true), baselineOutputHash: z.string().regex(/^[a-f0-9]{64}$/), candidateOutputHash: z.string().regex(/^[a-f0-9]{64}$/), completedAt: z.string().datetime(),
  testNamesHash: z.string().regex(/^[a-f0-9]{64}$/),
  executionScope: z.literal('private-repository').optional(), runnerRepositoryId: z.number().int().positive().safe().optional(), runnerInstallationId: z.number().int().positive().safe().optional(),
  bindingHash: z.string().regex(/^[a-f0-9]{64}$/).optional(), envelopeHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
}).strict();
async function boundedBytes(response: Response, limit: number): Promise<Uint8Array> {
  if (Number(response.headers.get('content-length')) > limit) throw new ReviewEngineError('RUNNER_RESPONSE_INVALID', 'The verification artifact is oversized.', 502);
  const reader = response.body?.getReader(); if (!reader) throw new ReviewEngineError('RUNNER_RESPONSE_INVALID', 'The verification artifact is empty.', 502);
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const next = await reader.read(); if (next.done) break;
    length += next.value.length;
    if (length > limit) { await reader.cancel(); throw new ReviewEngineError('RUNNER_RESPONSE_INVALID', 'The verification artifact is oversized.', 502); }
    chunks.push(next.value);
  }
  const result = new Uint8Array(length); let at = 0; for (const chunk of chunks) { result.set(chunk, at); at += chunk.length; } return result;
}
export function decodeProofArtifact(bytes: Uint8Array): z.infer<typeof proofSchema> {
  if (bytes.length > 65_536) throw new ReviewEngineError('RUNNER_PROOF_INVALID', 'The verification artifact exceeded its size limit.', 502);
  try {
    const files = unzipSync(bytes, { filter: file => file.name === 'proof.json' && file.originalSize <= 16_000 });
    if (!files['proof.json'] || Object.keys(files).length !== 1 || files['proof.json'].length > 16_000) throw new Error('Invalid artifact');
    return proofSchema.parse(JSON.parse(Buffer.from(files['proof.json']).toString('utf8')));
  } catch { throw new ReviewEngineError('RUNNER_PROOF_INVALID', 'The verification artifact was missing or invalid.', 502); }
}
/** Public snapshots use a shared runner. Private snapshots require tenant-bound same-repository encrypted execution. */
export function createActionsRunner(env: EngineEnvironment = process.env, options: ActionsOptions = {}) {
  const fetcher = options.fetch ?? fetch;
  const deadline = Date.now() + 45_000;
  const config = () => {
    const repository = env.REVIEW_ACTIONS_REPOSITORY || '';
    const repositoryId = Number(env.REVIEW_ACTIONS_REPOSITORY_ID); const installationId = Number(env.REVIEW_ACTIONS_INSTALLATION_ID);
    const ref = env.REVIEW_ACTIONS_REF || ''; const expectedSha = env.REVIEW_ACTIONS_SHA || ''; const image = env.REVIEW_ACTIONS_IMAGE || '';
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) || !Number.isSafeInteger(repositoryId) || repositoryId < 1 || !Number.isSafeInteger(installationId) || installationId < 1 || !/^[A-Za-z0-9_./-]{1,100}$/.test(ref) || ref.includes('..') || !SHA.test(expectedSha) || !IMAGE.test(image)) throw new ReviewEngineError('RUNNER_NOT_CONFIGURED', 'Configure the pinned, isolated verification runner before generating tested PRs.', 503);
    return { repository, repositoryId, installationId, ref, expectedSha, image, workflow: WORKFLOW };
  };
  const request = async (path: string, token: string, method = 'GET', body?: unknown): Promise<any> => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new ReviewEngineError('RUNNER_STAGE_TIMEOUT', 'This runner stage exceeded its time budget. Resume the saved job.', 504);
    let response: Response;
    try { response = await fetcher(`https://api.github.com${path}`, { method, redirect: 'error', signal: AbortSignal.timeout(Math.min(10_000, remaining)), headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10', 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); }
    catch { throw new ReviewEngineError(method === 'POST' ? 'RUNNER_SUBMISSION_UNCERTAIN' : 'RUNNER_UNAVAILABLE', method === 'POST' ? 'The runner submission outcome is uncertain. Inspect runs before retrying.' : 'The verification runner is temporarily unavailable.', 502); }
    if (!response.ok) throw new ReviewEngineError('RUNNER_REQUEST_FAILED', 'GitHub rejected the isolated runner request. Check its installation permission.', 502);
    const bytes = await boundedBytes(response, 100_000);
    try { return JSON.parse(Buffer.from(bytes).toString('utf8')); } catch { throw new ReviewEngineError('RUNNER_RESPONSE_INVALID', 'GitHub returned an invalid runner response.', 502); }
  };
  const privateConfig = (binding: PrivateRunnerBinding) => ({ repository: binding.repository, repositoryId: binding.repositoryId, installationId: binding.installationId, ref: binding.ref, expectedSha: binding.sha, image: binding.image, workflow: PRIVATE_WORKFLOW });
  const auth = async (write: boolean, cfg = config()) => {
    const token = await request(`/app/installations/${cfg.installationId}/access_tokens`, createGitHubAppJwt(env, (options.now ?? Date.now)()), 'POST', { repository_ids: [cfg.repositoryId], permissions: { actions: write ? 'write' : 'read', contents: 'read' } });
    if (typeof token.token !== 'string' || !Number.isFinite(Date.parse(token.expires_at)) || Date.parse(token.expires_at) <= (options.now ?? Date.now)()) throw new ReviewEngineError('RUNNER_AUTH_INVALID', 'GitHub did not provide a valid short-lived runner token.', 502);
    return { cfg, token: token.token as string };
  };
  return {
    async probePrivateRepository(repository: RepositoryBinding, context: ActionsContext): Promise<{ configured: true; executionScope: 'private-repository'; runnerSha: string }> {
      const binding = resolvePrivateRunner(env, context.organizationId, repository);
      const { cfg, token } = await auth(false, privateConfig(binding));
      const [found, ref, workflow] = await Promise.all([request(`/repos/${cfg.repository}`, token), request(`/repos/${cfg.repository}/commits/${encodeURIComponent(cfg.ref)}`, token), request(`/repos/${cfg.repository}/actions/workflows/review-private-verify.yml`, token)]);
      if (found.id !== cfg.repositoryId || found.private !== true || found.full_name?.toLowerCase() !== cfg.repository.toLowerCase() || found.archived || found.disabled) throw new ReviewEngineError('PRIVATE_RUNNER_SCOPE', 'Private verification must remain inside the same available private source repository.', 409);
      if (ref.sha !== cfg.expectedSha || workflow.path !== PRIVATE_WORKFLOW || workflow.state !== 'active' || !Number.isSafeInteger(workflow.id)) throw new ReviewEngineError('RUNNER_PIN_CHANGED', 'The private verifier workflow or approved pin is unavailable. Complete repository setup first.', 409);
      return { configured: true, executionScope: 'private-repository', runnerSha: cfg.expectedSha };
    },
    async startActionsVerification(snapshot: RepositorySnapshot, candidate: CandidatePatch, evidenceHash: string, context?: ActionsContext): Promise<ActionsReceipt> {
      validateCandidate(snapshot, candidate);
      if (typeof snapshot.repository.isPrivate !== 'boolean' || evidenceHash !== candidate.evidenceHash) throw new ReviewEngineError('PUBLIC_RUNNER_SCOPE', 'Verification requires explicit repository visibility and matching evidence.', 409);
      const binding = snapshot.repository.isPrivate ? resolvePrivateRunner(env, context?.organizationId, snapshot.repository) : undefined;
      const { cfg, token } = await auth(true, binding ? privateConfig(binding) : config());
      const [source, runner, ref, workflow] = await Promise.all([
        request(`/repos/${snapshot.repository.owner}/${snapshot.repository.name}`, token),
        request(`/repos/${cfg.repository}`, token),
        request(`/repos/${cfg.repository}/commits/${encodeURIComponent(cfg.ref)}`, token),
        request(`/repos/${cfg.repository}/actions/workflows/${cfg.workflow.split('/').at(-1)}`, token),
      ]);
      if (source.private !== snapshot.repository.isPrivate || source.id !== snapshot.repository.repositoryId || (binding && (source.full_name?.toLowerCase() !== cfg.repository.toLowerCase() || runner.private !== true || source.archived || source.disabled || runner.archived || runner.disabled))) throw new ReviewEngineError(binding ? 'PRIVATE_RUNNER_SCOPE' : 'PUBLIC_RUNNER_SCOPE', 'Repository visibility or identity changed. Verification was stopped before transmitting source.', 409);
      if (runner.id !== cfg.repositoryId || runner.full_name?.toLowerCase() !== cfg.repository.toLowerCase() || ref.sha !== cfg.expectedSha || workflow.path !== cfg.workflow || workflow.state !== 'active' || !Number.isSafeInteger(workflow.id)) throw new ReviewEngineError('RUNNER_PIN_CHANGED', 'The trusted verification runner changed. An administrator must review and update its pin.', 409);
      const nonce = randomBytes(16).toString('hex');
      const boundedCandidate: CandidatePatch = { path: candidate.path, content: candidate.content, rationale: '', risk: '', baseSha: candidate.baseSha, snapshotHash: candidate.snapshotHash, evidenceHash: candidate.evidenceHash, hash: candidate.hash };
      // Rationale, laptop evidence, user identities, organization data and credentials are deliberately omitted.
      const payload = JSON.stringify({ version: 1, nonce, snapshot, candidate: boundedCandidate, evidenceHash, image: cfg.image });
      const encoded = Buffer.from(payload).toString('base64');
      if (encoded.length > 60_000 || snapshot.files.reduce((sum, f) => sum + Buffer.byteLength(f.content), 0) > 40_000) throw new ReviewEngineError('RUNNER_INPUT_TOO_LARGE', 'The isolated pilot accepts a bounded parser and test suite below 40 KB.', 413);
      let envelope: string | undefined;
      if (binding) {
        try { envelope = sealPrivatePayload(payload, binding.publicKeyPem, { version: 1, organizationId: binding.organizationId, repository: binding.repository, repositoryId: binding.repositoryId, installationId: binding.installationId, runnerSha: binding.sha, bindingHash: binding.bindingHash, keyFingerprint: binding.keyFingerprint, nonce }); }
        catch { throw new ReviewEngineError('PRIVATE_PAYLOAD_INVALID', 'The bounded private verification payload could not be encrypted for its approved verifier.', 413); }
      }
      const dispatched = await request(`/repos/${cfg.repository}/actions/workflows/${cfg.workflow.split('/').at(-1)}/dispatches`, token, 'POST', { ref: cfg.ref, inputs: envelope ? { envelope, nonce } : { payload: encoded, nonce } });
      if (!Number.isSafeInteger(dispatched.workflow_run_id) || dispatched.workflow_run_id < 1) throw new ReviewEngineError('RUNNER_SUBMISSION_UNCERTAIN', 'GitHub did not return a workflow run ID. Inspect runs before retrying.', 502);
      return { provider: 'GitHub Actions isolated container', runId: dispatched.workflow_run_id, runnerRepository: cfg.repository, runnerRepositoryId: cfg.repositoryId, runnerSha: cfg.expectedSha, workflowId: workflow.id, nonce, payloadHash: sha256(payload), snapshotHash: snapshot.hash, candidateHash: candidate.hash, evidenceHash, imageId: cfg.image, startedAt: new Date((options.now ?? Date.now)()).toISOString(), ...(binding ? { executionScope: 'private-repository' as const, organizationId: binding.organizationId, runnerInstallationId: binding.installationId, bindingHash: binding.bindingHash, envelopeHash: sha256(envelope!), keyFingerprint: binding.keyFingerprint } : {}) };
    },
    async pollActionsVerification(receipt: ActionsReceipt, context?: ActionsContext): Promise<ActionsPoll> {
      const isPrivate = receipt.executionScope === 'private-repository';
      if (receipt.executionScope && !['public-shared', 'private-repository'].includes(receipt.executionScope)) throw new ReviewEngineError('RUNNER_RECEIPT_INVALID', 'The saved runner scope is invalid.', 409);
      let binding: PrivateRunnerBinding | undefined;
      if (isPrivate) {
        if (receipt.organizationId !== context?.organizationId) throw new ReviewEngineError('PRIVATE_RUNNER_SCOPE', 'This private runner receipt belongs to another organization.', 403);
        const [owner, name] = receipt.runnerRepository.split('/');
        binding = resolvePrivateRunner(env, context?.organizationId, { owner, name, repositoryId: receipt.runnerRepositoryId, installationId: receipt.runnerInstallationId!, defaultBranch: 'main', isPrivate: true });
        if (receipt.bindingHash !== binding.bindingHash || receipt.keyFingerprint !== binding.keyFingerprint || !/^[a-f0-9]{64}$/.test(receipt.envelopeHash ?? '')) throw new ReviewEngineError('RUNNER_RECEIPT_INVALID', 'The private runner binding or encryption key changed. Reverify this candidate.', 409);
      }
      const { cfg, token } = await auth(false, binding ? privateConfig(binding) : config());
      if (receipt.runnerRepository !== cfg.repository || receipt.runnerRepositoryId !== cfg.repositoryId || receipt.runnerSha !== cfg.expectedSha || receipt.imageId !== cfg.image || !Number.isSafeInteger(receipt.runId) || receipt.runId < 1) throw new ReviewEngineError('RUNNER_RECEIPT_INVALID', 'The saved runner receipt does not match the configured verifier.', 409);
      const run = await request(`/repos/${cfg.repository}/actions/runs/${receipt.runId}`, token);
      if (isPrivate) {
        const repository = await request(`/repos/${cfg.repository}`, token);
        if (repository.id !== cfg.repositoryId || repository.private !== true || repository.full_name?.toLowerCase() !== cfg.repository.toLowerCase() || repository.archived || repository.disabled) throw new ReviewEngineError('PRIVATE_RUNNER_SCOPE', 'The private verifier repository changed visibility or identity. No proof was accepted.', 409);
      }
      if (run.id !== receipt.runId || run.repository?.id !== cfg.repositoryId || run.head_sha !== receipt.runnerSha || run.workflow_id !== receipt.workflowId || run.path?.split('@')[0] !== cfg.workflow || run.event !== 'workflow_dispatch' || run.display_title !== `SpareCycle verification ${receipt.nonce}` || run.run_attempt !== 1) throw new ReviewEngineError('RUNNER_PROVENANCE_INVALID', 'The workflow run does not match the pinned verification request.', 409);
      const url = `https://github.com/${cfg.repository}/actions/runs/${receipt.runId}`;
      if (run.status !== 'completed') return { status: 'pending', message: 'The isolated GitHub Actions verification is queued or running.' };
      if (run.conclusion !== 'success') return { status: 'failed', message: 'The isolated runner did not verify a failing baseline followed by a passing candidate.', url };
      const list = await request(`/repos/${cfg.repository}/actions/runs/${receipt.runId}/artifacts`, token);
      const artifacts = Array.isArray(list.artifacts) ? list.artifacts.filter((a: any) => a.name === `sparecycle-proof-${receipt.nonce}` && !a.expired) : [];
      if (artifacts.length !== 1 || !Number.isSafeInteger(artifacts[0].id) || artifacts[0].size_in_bytes > 65_536) throw new ReviewEngineError('RUNNER_PROOF_INVALID', 'A unique, bounded verification artifact was not found.', 502);
      const redirect = await fetcher(`https://api.github.com/repos/${cfg.repository}/actions/artifacts/${artifacts[0].id}/zip`, { redirect: 'manual', signal: AbortSignal.timeout(10_000), headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10' } });
      let download = redirect;
      if (redirect.status === 302) {
        const location = new URL(redirect.headers.get('location') || 'https://invalid.invalid');
        if (location.protocol !== 'https:' || location.username || location.password || location.port || !(/\.blob\.core\.windows\.net$/.test(location.hostname) || /\.actions\.githubusercontent\.com$/.test(location.hostname))) throw new ReviewEngineError('RUNNER_DOWNLOAD_INVALID', 'GitHub returned an unexpected artifact download destination.', 502);
        // Never forward GitHub credentials to the artifact host.
        download = await fetcher(location, { redirect: 'error', signal: AbortSignal.timeout(10_000) });
      }
      if (!download.ok) throw new ReviewEngineError('RUNNER_DOWNLOAD_INVALID', 'The verification artifact could not be downloaded.', 502);
      const proof = decodeProofArtifact(await boundedBytes(download, 65_536));
      if (isPrivate ? proof.executionScope !== 'private-repository' || proof.runnerRepositoryId !== cfg.repositoryId || proof.runnerInstallationId !== cfg.installationId || proof.bindingHash !== receipt.bindingHash || proof.envelopeHash !== receipt.envelopeHash : proof.executionScope !== undefined) throw new ReviewEngineError('RUNNER_PROOF_INVALID', 'The verification proof does not match this repository execution boundary.', 409);
      if (proof.nonce !== receipt.nonce || proof.payloadHash !== receipt.payloadHash || proof.runId !== receipt.runId || proof.runnerSha !== receipt.runnerSha || proof.snapshotHash !== receipt.snapshotHash || proof.candidateHash !== receipt.candidateHash || proof.evidenceHash !== receipt.evidenceHash || proof.imageId !== receipt.imageId || proof.baselineOperationId !== `github-actions:${receipt.runId}:baseline` || proof.candidateOperationId !== `github-actions:${receipt.runId}:candidate` || proof.candidatePassed !== proof.baselinePassed + proof.baselineFailed) throw new ReviewEngineError('RUNNER_PROOF_INVALID', 'The verification artifact does not match this exact source, patch, and evidence.', 409);
      return { status: 'passed', proof: { ...proof, provider: 'GitHub Actions isolated container' }, url };
    },
  };
}
