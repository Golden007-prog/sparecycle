import { createHash, createHmac, createSign, timingSafeEqual } from 'node:crypto';
import { parse } from 'acorn';
import { validateParserReplacement } from '../../scripts/review-parser-policy.mjs';
import { snapshotPreimage, candidatePreimage } from '../../scripts/review-integrity.mjs';

export type EngineEnvironment = Record<string, string | undefined>;
export class ReviewEngineError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 400) { super(message); this.name = 'ReviewEngineError'; }
}
export interface RepositoryBinding { installationId: number; repositoryId: number; owner: string; name: string; defaultBranch: string; isPrivate?: boolean }
export interface SnapshotFile { path: string; content: string; sha256: string; blobSha: string }
export interface RepositorySnapshot { repository: RepositoryBinding; baseSha: string; treeSha: string; targetPath: string; files: SnapshotFile[]; hash: string }
export interface CandidatePatch { path: string; content: string; rationale: string; risk: string; baseSha: string; snapshotHash: string; evidenceHash: string; hash: string }
export interface IndependentReview { approved: boolean; reasons: string[]; candidateHash: string; model: string }
export interface VerificationProof {
  provider?: 'Nebius Sandboxes' | 'GitHub Actions isolated container';
  snapshotHash: string; candidateHash: string; evidenceHash: string; imageId: string;
  baselineOperationId: string; candidateOperationId: string;
  baselineFailed: number; baselinePassed: number; candidatePassed: number; candidateFailed: number;
  testNamesHash: string;
  networkDisabled: true; completedAt: string;
  executionScope?: 'private-repository'; runnerRepositoryId?: number; runnerInstallationId?: number; bindingHash?: string; envelopeHash?: string;
}
export interface PublishInput {
  snapshot: RepositorySnapshot; candidate: CandidatePatch; verification: VerificationProof; review: IndependentReview;
  changeId: string; title: string; currentEvidenceHash: string;
  approval: { approvedBy: string; requestedBy: string; candidateHash: string; evidenceHash: string; snapshotHash: string };
}
export const sha256 = (value: string): string => createHash('sha256').update(value, 'utf8').digest('hex');
const SHA = /^[a-f0-9]{40}$/;
const HASH = /^[a-f0-9]{64}$/;
const IDENTIFIER = /^[A-Za-z0-9_.-]{1,100}$/;
export function allowedSourcePath(path: string): boolean { return /^src\/diagnostics\/[A-Za-z0-9_-]+\.mjs$/.test(path); }
export function allowedTestPath(path: string): boolean { return /^tests\/diagnostics\/[A-Za-z0-9_-]+\.test\.mjs$/.test(path); }
function assertRepository(repo: RepositoryBinding): void {
  if (!Number.isSafeInteger(repo.installationId) || repo.installationId < 1 || !Number.isSafeInteger(repo.repositoryId) || repo.repositoryId < 1 || !IDENTIFIER.test(repo.owner) || !IDENTIFIER.test(repo.name) || !/^[A-Za-z0-9_/-]{1,100}$/.test(repo.defaultBranch) || repo.defaultBranch.includes('..') || repo.defaultBranch.includes('//') || (repo.isPrivate !== undefined && typeof repo.isPrivate !== 'boolean')) throw new ReviewEngineError('INVALID_REPOSITORY', 'The repository binding is invalid.');
}
export function snapshotHash(snapshot: Omit<RepositorySnapshot, 'hash'>): string {
  return sha256(snapshotPreimage(snapshot));
}
export function validateSnapshot(snapshot: RepositorySnapshot): void {
  assertRepository(snapshot.repository);
  if (!SHA.test(snapshot.baseSha) || !SHA.test(snapshot.treeSha) || !allowedSourcePath(snapshot.targetPath) || snapshot.files.length < 2 || snapshot.files.length > 9 || new Set(snapshot.files.map(f => f.path)).size !== snapshot.files.length || snapshot.files.filter(f => allowedSourcePath(f.path)).length !== 1 || !snapshot.files.some(f => f.path === snapshot.targetPath) || !snapshot.files.some(f => allowedTestPath(f.path))) throw new ReviewEngineError('INVALID_SNAPSHOT', 'The repository snapshot is outside the diagnostic verification profile.');
  let bytes = 0;
  for (const f of snapshot.files) {
    bytes += Buffer.byteLength(f.content);
    if ((!allowedSourcePath(f.path) && !allowedTestPath(f.path)) || Buffer.byteLength(f.content) > 32_000 || sha256(f.content) !== f.sha256 || !SHA.test(f.blobSha)) throw new ReviewEngineError('INVALID_SNAPSHOT', 'A snapshot file failed integrity checks.');
  }
  if (bytes > 80_000 || snapshotHash(snapshot) !== snapshot.hash) throw new ReviewEngineError('INVALID_SNAPSHOT', 'The snapshot hash or size is invalid.');
}
export function candidateHash(candidate: Omit<CandidatePatch, 'hash'>): string {
  return sha256(candidatePreimage(candidate));
}
export function validateCandidate(snapshot: RepositorySnapshot, candidate: CandidatePatch): void {
  validateSnapshot(snapshot);
  if (candidate.path !== snapshot.targetPath || !allowedSourcePath(candidate.path) || candidate.baseSha !== snapshot.baseSha || candidate.snapshotHash !== snapshot.hash || !HASH.test(candidate.evidenceHash) || candidateHash(candidate) !== candidate.hash || !candidate.content.trim() || Buffer.byteLength(candidate.content) > 32_000 || candidate.content === snapshot.files.find(f => f.path === candidate.path)?.content) throw new ReviewEngineError('INVALID_PATCH', 'The proposed patch is empty, stale, or outside its approved file.');
  // Parse identifiers and scope instead of searching text: escaped or computed constructors must not bypass this policy.
  try { validateParserReplacement(snapshot.files.find(f => f.path === snapshot.targetPath)!.content, candidate.content, parse); }
  catch { throw new ReviewEngineError('UNSAFE_PATCH', 'The replacement must contain executable pure parser code, preserve all original exports, and use only local computation and safe literal property access.'); }
}
export function verifyWebhookSignature(rawBody: Uint8Array, signature: string | undefined, secret: string): boolean {
  if (!secret || !signature || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest();
  const actual = Buffer.from(signature.slice(7), 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function createGitHubAppJwt(env: EngineEnvironment, now = Date.now()): string {
  if (!env.GITHUB_APP_ID || !/^\d+$/.test(env.GITHUB_APP_ID) || !env.GITHUB_APP_PRIVATE_KEY) throw new ReviewEngineError('GITHUB_NOT_CONFIGURED', 'The GitHub App has not been configured.', 503);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ iat: Math.floor(now / 1000) - 60, exp: Math.floor(now / 1000) + 540, iss: env.GITHUB_APP_ID })).toString('base64url');
  const message = `${header}.${payload}`;
  try { return `${message}.${createSign('RSA-SHA256').update(message).sign(env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n'), 'base64url')}`; }
  catch { throw new ReviewEngineError('GITHUB_NOT_CONFIGURED', 'The GitHub App signing key is invalid.', 503); }
}
export interface GitHubOptions { fetch?: typeof fetch; now?: () => number }
function githubTransport(fetcher: typeof fetch, deadline = Date.now() + 45_000) {
  return async (path: string, token: string, method = 'GET', body?: unknown): Promise<any> => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new ReviewEngineError('GITHUB_STAGE_TIMEOUT', 'The GitHub stage exceeded its time budget. Resume the saved job.', 504);
    let response: Response;
    try { response = await fetcher(`https://api.github.com${path}`, { method, redirect: 'error', signal: AbortSignal.timeout(Math.min(12_000, remaining)), headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10', 'Content-Type': 'application/json', 'User-Agent': 'SpareCycle-Review' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); }
    catch { throw new ReviewEngineError(method === 'GET' ? 'GITHUB_UNAVAILABLE' : 'GITHUB_WRITE_UNCERTAIN', method === 'GET' ? 'GitHub is temporarily unavailable.' : 'GitHub may have accepted this write. Inspect the recorded branch before retrying.', 502); }
    if (!response.ok) throw new ReviewEngineError(response.status === 404 ? 'REPOSITORY_NOT_ACCESSIBLE' : 'GITHUB_REQUEST_FAILED', 'GitHub rejected the request. Check installation access and repository permissions.', response.status === 404 ? 404 : 502);
    const text = await response.text();
    if (text.length > 1_000_000) throw new ReviewEngineError('GITHUB_RESPONSE_INVALID', 'GitHub returned an oversized response.', 502);
    try { return JSON.parse(text); } catch { throw new ReviewEngineError('GITHUB_RESPONSE_INVALID', 'GitHub returned an invalid response.', 502); }
  };
}
/** Call while linking with a short-lived App user token or a fine-grained token supplied by the actor. */
export async function verifyUserRepositoryAccess(userToken: string, repo: RepositoryBinding, options: GitHubOptions = {}): Promise<void> {
  assertRepository(repo);
  if (!userToken) throw new ReviewEngineError('GITHUB_USER_AUTH_REQUIRED', 'Authenticate with GitHub before linking a project.', 401);
  const request = githubTransport(options.fetch ?? fetch);
  const found = await request(`/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`, userToken);
  if (found.id === repo.repositoryId && found.full_name?.toLowerCase() === `${repo.owner}/${repo.name}`.toLowerCase() && (found.permissions?.admin || found.permissions?.push)) return;
  throw new ReviewEngineError('GITHUB_REPOSITORY_FORBIDDEN', 'Your GitHub account must have write access to this installed repository.', 403);
}
export function validatePublishInput(input: PublishInput): void {
  const { snapshot, candidate, verification: v, review, approval } = input;
  validateCandidate(snapshot, candidate);
  if (!/^[A-Za-z0-9-]{1,80}$/.test(input.changeId) || !input.title.trim() || input.title.length > 200) throw new ReviewEngineError('INVALID_CHANGE', 'Invalid change request.');
  if (input.currentEvidenceHash !== candidate.evidenceHash || v.evidenceHash !== candidate.evidenceHash || v.snapshotHash !== snapshot.hash || v.candidateHash !== candidate.hash || !HASH.test(v.testNamesHash) || !v.networkDisabled || !v.imageId || !v.baselineOperationId || !v.candidateOperationId || v.baselineOperationId === v.candidateOperationId || !Number.isInteger(v.baselineFailed) || v.baselineFailed < 1 || !Number.isInteger(v.baselinePassed) || v.baselinePassed < 0 || v.candidateFailed !== 0 || v.candidatePassed !== v.baselinePassed + v.baselineFailed || !Number.isFinite(Date.parse(v.completedAt))) throw new ReviewEngineError('VERIFICATION_REQUIRED', 'A matching, isolated failing-baseline and passing-candidate test record is required.', 409);
  if (snapshot.repository.isPrivate === true && (v.provider !== 'GitHub Actions isolated container' || v.executionScope !== 'private-repository' || v.runnerRepositoryId !== snapshot.repository.repositoryId || v.runnerInstallationId !== snapshot.repository.installationId || !HASH.test(v.bindingHash ?? '') || !HASH.test(v.envelopeHash ?? ''))) throw new ReviewEngineError('PRIVATE_VERIFICATION_REQUIRED', 'Private publication requires encrypted verification in this exact private repository and installation.', 409);
  if (!review.approved || review.candidateHash !== candidate.hash || !approval.approvedBy || approval.approvedBy === approval.requestedBy || approval.candidateHash !== candidate.hash || approval.evidenceHash !== candidate.evidenceHash || approval.snapshotHash !== snapshot.hash) throw new ReviewEngineError('APPROVAL_REQUIRED', 'An independent reviewer must approve this exact patch, evidence, and snapshot.', 409);
}
export function createGitHubClient(env: EngineEnvironment = process.env, options: GitHubOptions = {}) {
  const request = githubTransport(options.fetch ?? fetch);
  const token = async (repo: RepositoryBinding, write: boolean): Promise<string> => {
    assertRepository(repo);
    const result = await request(`/app/installations/${repo.installationId}/access_tokens`, createGitHubAppJwt(env, (options.now ?? Date.now)()), 'POST', { repository_ids: [repo.repositoryId], permissions: { contents: write ? 'write' : 'read', ...(write ? { pull_requests: 'write' } : {}) } });
    if (!result.token || typeof result.token !== 'string' || !Number.isFinite(Date.parse(result.expires_at)) || Date.parse(result.expires_at) <= (options.now ?? Date.now)()) throw new ReviewEngineError('GITHUB_RESPONSE_INVALID', 'GitHub returned an invalid installation token.', 502);
    return result.token;
  };
  const prefix = (repo: RepositoryBinding) => `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`;
  const checkRepo = async (repo: RepositoryBinding, auth: string) => {
    const found = await request(prefix(repo), auth);
    if (found.id !== repo.repositoryId || found.full_name?.toLowerCase() !== `${repo.owner}/${repo.name}`.toLowerCase() || found.default_branch !== repo.defaultBranch || found.archived || found.disabled || (repo.isPrivate === true && found.private !== true)) throw new ReviewEngineError('REPOSITORY_CHANGED', 'Repository identity, privacy, branch, or availability changed. Reconnect this project.', 409);
    return found;
  };
  const head = async (repo: RepositoryBinding, auth: string): Promise<string> => {
    const data = await request(`${prefix(repo)}/git/ref/heads/${repo.defaultBranch.split('/').map(encodeURIComponent).join('/')}`, auth);
    if (!SHA.test(data.object?.sha) || data.object?.type !== 'commit') throw new ReviewEngineError('GITHUB_RESPONSE_INVALID', 'GitHub returned an invalid branch head.', 502);
    return data.object.sha;
  };
  return {
    async discoverRepository(installationId: number, repository: string, userToken: string): Promise<RepositoryBinding> {
      if (!/^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/.test(repository) || !userToken) throw new ReviewEngineError('INVALID_REPOSITORY', 'Enter owner/repository and a GitHub credential with repository write access.');
      const [owner, name] = repository.split('/');
      const found = await request(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, userToken);
      if (!found.permissions?.admin && !found.permissions?.push) throw new ReviewEngineError('GITHUB_REPOSITORY_FORBIDDEN', 'Your GitHub account must have write access to this repository.', 403);
      const repo: RepositoryBinding = { installationId, repositoryId: found.id, owner: found.owner?.login, name: found.name, defaultBranch: found.default_branch, isPrivate: found.private !== false };
      assertRepository(repo);
      if (`${repo.owner}/${repo.name}`.toLowerCase() !== repository.toLowerCase()) throw new ReviewEngineError('REPOSITORY_CHANGED', 'The repository was renamed. Use its current full name.', 409);
      // The user's permission and the App installation's selected-repository permission must both pass.
      await checkRepo(repo, await token(repo, false)); return repo;
    },
    async readSnapshot(repo: RepositoryBinding, targetPath: string, testPaths: string[]): Promise<RepositorySnapshot> {
      if (!allowedSourcePath(targetPath) || testPaths.length < 1 || testPaths.length > 8 || new Set(testPaths).size !== testPaths.length || !testPaths.every(allowedTestPath)) throw new ReviewEngineError('UNSUPPORTED_PROFILE', 'Select one diagnostic parser and one to eight diagnostic tests.');
      const auth = await token(repo, false); const verified = await checkRepo(repo, auth);
      const baseSha = await head(repo, auth);
      const commit = await request(`${prefix(repo)}/git/commits/${baseSha}`, auth);
      if (!SHA.test(commit.tree?.sha)) throw new ReviewEngineError('GITHUB_RESPONSE_INVALID', 'GitHub returned an invalid tree.', 502);
      const tree = await request(`${prefix(repo)}/git/trees/${commit.tree.sha}?recursive=1`, auth);
      if (tree.truncated || !Array.isArray(tree.tree)) throw new ReviewEngineError('UNSUPPORTED_REPOSITORY', 'The repository tree exceeds the bounded verification profile.');
      const files: SnapshotFile[] = await Promise.all([targetPath, ...testPaths].sort().map(async path => {
        const entry = tree.tree.find((file: any) => file.path === path);
        if (entry?.type !== 'blob' || entry?.mode !== '100644') throw new ReviewEngineError('UNSUPPORTED_FILE', 'The diagnostic profile accepts regular, non-executable files only.');
        const data = await request(`${prefix(repo)}/contents/${path}?ref=${baseSha}`, auth);
        if (data.type !== 'file' || data.encoding !== 'base64' || data.size > 32_000 || !SHA.test(data.sha) || data.sha !== entry.sha || typeof data.content !== 'string' || data.content.length > 45_000) throw new ReviewEngineError('UNSUPPORTED_FILE', 'Only small, regular UTF-8 source and test files are supported.');
        const bytes = Buffer.from(data.content.replace(/\s/g, ''), 'base64');
        const content = bytes.toString('utf8');
        if (Buffer.byteLength(content) !== bytes.length || content.includes('\0') || bytes.length !== data.size) throw new ReviewEngineError('UNSUPPORTED_FILE', 'A repository file is not valid UTF-8.');
        return { path, content, sha256: sha256(content), blobSha: data.sha };
      }));
      const snapshot = { repository: { ...repo, isPrivate: verified.private !== false }, baseSha, treeSha: commit.tree.sha, targetPath, files, hash: '' };
      snapshot.hash = snapshotHash(snapshot); validateSnapshot(snapshot); return snapshot;
    },
    async publishDraft(input: PublishInput): Promise<{ url: string; number: number; branch: string; commitSha: string }> {
      // All proof and approval fields MUST be loaded from the server database, never accepted from a browser.
      validatePublishInput(input);
      const { snapshot, candidate } = input; const repo = snapshot.repository;
      const publicTitle = `Fix diagnostic parser ${candidate.path.split('/').at(-1)}`;
      const auth = await token(repo, true); await checkRepo(repo, auth);
      if (await head(repo, auth) !== snapshot.baseSha) throw new ReviewEngineError('STALE_HEAD', 'The default branch changed. Re-snapshot, re-test, and re-approve.', 409);
      const branch = `sparecycle/${input.changeId}-${candidate.hash.slice(0, 12)}`;
      const existing = await request(`${prefix(repo)}/pulls?state=all&head=${encodeURIComponent(`${repo.owner}:${branch}`)}`, auth);
      if (!Array.isArray(existing)) throw new ReviewEngineError('GITHUB_RESPONSE_INVALID', 'GitHub returned invalid pull request data.', 502);
      let commitSha: string | undefined;
      try {
        const ref = await request(`${prefix(repo)}/git/ref/heads/${branch}`, auth);
        if (!SHA.test(ref.object?.sha)) throw new ReviewEngineError('PUBLICATION_CONFLICT', 'The existing publication branch is invalid.', 409);
        const comparison = await request(`${prefix(repo)}/compare/${snapshot.baseSha}...${ref.object.sha}`, auth);
        const expectedBlob = createHash('sha1').update(`blob ${Buffer.byteLength(candidate.content)}\0`).update(candidate.content).digest('hex');
        if (comparison.status !== 'ahead' || comparison.total_commits !== 1 || !Array.isArray(comparison.files) || comparison.files.length !== 1 || comparison.files[0].filename !== candidate.path || comparison.files[0].status !== 'modified' || comparison.files[0].sha !== expectedBlob) throw new ReviewEngineError('PUBLICATION_CONFLICT', 'The existing branch differs from the tested patch. It will not be overwritten.', 409);
        const savedCommit = await request(`${prefix(repo)}/git/commits/${ref.object.sha}`, auth);
        if (!Array.isArray(savedCommit.parents) || savedCommit.parents.length !== 1 || savedCommit.parents[0].sha !== snapshot.baseSha || !SHA.test(savedCommit.tree?.sha)) throw new ReviewEngineError('PUBLICATION_CONFLICT', 'The existing branch has unexpected ancestry. It will not be overwritten.', 409);
        const savedTree = await request(`${prefix(repo)}/git/trees/${savedCommit.tree.sha}?recursive=1`, auth);
        const savedFile = Array.isArray(savedTree.tree) && savedTree.tree.find((f: any) => f.path === candidate.path);
        if (savedTree.truncated || !savedFile || savedFile.type !== 'blob' || savedFile.mode !== '100644' || savedFile.sha !== expectedBlob) throw new ReviewEngineError('PUBLICATION_CONFLICT', 'The existing branch changes file type or permissions. It will not be overwritten.', 409);
        commitSha = ref.object.sha;
      } catch (error) { if (!(error instanceof ReviewEngineError) || error.code !== 'REPOSITORY_NOT_ACCESSIBLE') throw error; }
      if (existing.length) {
        const pr = existing.find((p: any) => p.head?.ref === branch && p.base?.ref === repo.defaultBranch && p.head?.sha === commitSha);
        if (pr?.draft && pr.state === 'open' && Number.isInteger(pr.number) && /^https:\/\/github\.com\//.test(pr.html_url) && commitSha) return { url: pr.html_url, number: pr.number, branch, commitSha };
        throw new ReviewEngineError('PR_ALREADY_EXISTS', 'This change already has a pull request with a different state. Inspect it before continuing.', 409);
      }
      if (!commitSha) {
        if (repo.isPrivate) await checkRepo(repo,auth);
        const blob = await request(`${prefix(repo)}/git/blobs`, auth, 'POST', { content: candidate.content, encoding: 'utf-8' });
        if (!SHA.test(blob.sha)) throw new ReviewEngineError('GITHUB_RESPONSE_INVALID', 'GitHub returned an invalid blob.', 502);
        const tree = await request(`${prefix(repo)}/git/trees`, auth, 'POST', { base_tree: snapshot.treeSha, tree: [{ path: candidate.path, mode: '100644', type: 'blob', sha: blob.sha }] });
        if (!SHA.test(tree.sha)) throw new ReviewEngineError('GITHUB_RESPONSE_INVALID', 'GitHub returned an invalid tree.', 502);
        const commit = await request(`${prefix(repo)}/git/commits`, auth, 'POST', { message: `fix: ${publicTitle}\n\nSpareCycle change ${input.changeId}\nCandidate SHA-256: ${candidate.hash}`, tree: tree.sha, parents: [snapshot.baseSha] });
        if (!SHA.test(commit.sha)) throw new ReviewEngineError('GITHUB_RESPONSE_INVALID', 'GitHub returned an invalid commit.', 502);
        // GitHub has no atomic PR/head guard; final repository review remains mandatory.
        if (await head(repo, auth) !== snapshot.baseSha) throw new ReviewEngineError('STALE_HEAD', 'The default branch changed during publication. Re-test the change.', 409);
        await request(`${prefix(repo)}/git/refs`, auth, 'POST', { ref: `refs/heads/${branch}`, sha: commit.sha });
        commitSha = commit.sha;
      }
      // Only the explicitly reviewed patch and non-personal verification metadata cross into GitHub.
      // The organization's case title and model rationale/risk can contain private laptop evidence.
      const body = `## Recovery change ${input.changeId}\n\nDiagnostic parser: \`${candidate.path}\`.\n\n### Verification\n\n- Baseline: ${input.verification.baselineFailed} failing, ${input.verification.baselinePassed} passing tests.\n- Candidate: ${input.verification.candidatePassed} passing, zero failing tests.\n- Network disabled; provider: ${input.verification.provider ?? 'Nebius Sandboxes'}; image \`${input.verification.imageId}\`.\n- Base commit: \`${snapshot.baseSha}\`.\n- Candidate SHA-256: \`${candidate.hash}\`.\n- Evidence SHA-256: \`${candidate.evidenceHash}\`.\n- Named-test SHA-256: \`${input.verification.testNamesHash}\`.\n\nThis draft needs repository review. Software tests do not certify a physical laptop or authorize fleet deployment.`;
      if (repo.isPrivate) await checkRepo(repo,auth);
      const pr = await request(`${prefix(repo)}/pulls`, auth, 'POST', { title: `[SpareCycle] ${publicTitle}`, body, head: branch, base: repo.defaultBranch, draft: true, maintainer_can_modify: false });
      if (!pr.draft || !Number.isInteger(pr.number) || !/^https:\/\/github\.com\//.test(pr.html_url)) throw new ReviewEngineError('GITHUB_WRITE_UNCERTAIN', 'GitHub returned an unexpected draft result. Inspect the recorded branch before retrying.', 502);
      return { url: pr.html_url, number: pr.number, branch, commitSha: commitSha! };
    },
  };
}
