import type { authenticateReviewRequest, ReviewEnvironment } from './auth.js';
import { ReviewAccessError } from './auth.js';
import { createActionsRunner, type ActionsReceipt } from './actions-runner.js';
import { createGitHubClient, ReviewEngineError, type RepositorySnapshot, type CandidatePatch, type VerificationProof, type IndependentReview, type RepositoryBinding } from './github.js';
import { investigateChange, proposePatch, reviewCandidate, evidenceDigest, stageReservationCents } from './harness.js';
import { createNebiusSandbox, buildVerificationProof, type SandboxReceipt, type SandboxResult } from './sandbox.js';
import { ReviewStore, type ReviewChangeContext, type JobCompletion } from './store.js';
import type { ReviewAction, ReviewJob, ModelTier, JobStage, ReviewProject } from './types.js';

type Auth = Awaited<ReturnType<typeof authenticateReviewRequest>>;
type Checkpoint = Record<string, unknown> & {
  evidenceHash?: string; evidenceVersion?: number; snapshot?: RepositorySnapshot; candidate?: CandidatePatch;
  verification?: VerificationProof; review?: IndependentReview; inFlight?: string;
  actions?: ActionsReceipt; baselineReceipt?: SandboxReceipt; candidateReceipt?: SandboxReceipt;
  baseline?: SandboxResult; backend?: 'actions' | 'nebius';
};
export type StorePort = Pick<ReviewStore, 'listOrganizations' | 'createOrganization' | 'getOverview' | 'createLaptop' | 'addEvidence' | 'connectProject' | 'createChange' | 'getChangeContext' | 'getJob' | 'reserveJob' | 'claimJob' | 'saveCheckpoint' | 'completeJob' | 'cancelJob' | 'approveChange' | 'createInvite' | 'redeemInvite' | 'setBudget'>;
export interface ServiceOptions {
  store: StorePort; userId: string; env?: ReviewEnvironment;
  github?: ReturnType<typeof createGitHubClient>; sandbox?: ReturnType<typeof createNebiusSandbox>;
  actions?: ReturnType<typeof createActionsRunner>;
  investigate?: typeof investigateChange; propose?: typeof proposePatch; review?: typeof reviewCandidate;
}
export function focusedEvidence(context: ReviewChangeContext): string {
  if (!context.evidence.length) throw new ReviewEngineError('EVIDENCE_REQUIRED', 'Add a technician note or diagnostic log to the laptop before investigation.', 409);
  const text = JSON.stringify({ description: context.change.description, laptop: { assetTag: context.laptop.assetTag, manufacturer: context.laptop.manufacturer, model: context.laptop.model, operatingSystem: context.laptop.operatingSystem }, evidenceVersion: context.change.evidenceVersion, evidence: [...context.evidence].sort((a,b)=>a.version-b.version).map(e=>({version:e.version,kind:e.kind,source:e.source,content:e.content})) });
  if (text.length > 18_000 || context.evidence.length >= 50) throw new ReviewEngineError('EVIDENCE_CONTEXT_TOO_LARGE', 'This passport exceeds the focused review limit. Export and curate a smaller diagnostic case before starting a new review.', 409);
  return text;
}
export function displayPatch(snapshot: RepositorySnapshot, candidate: CandidatePatch): string {
  const before = snapshot.files.find(f=>f.path===candidate.path)!.content.replace(/\n$/, '').split('\n');
  const after = candidate.content.replace(/\n$/, '').split('\n');
  return `--- a/${candidate.path}\n+++ b/${candidate.path}\n@@ -1,${before.length} +1,${after.length} @@\n${before.map(line=>`-${line}`).join('\n')}\n${after.map(line=>`+${line}`).join('\n')}\n`;
}
const tierFor = (tier: ModelTier, stage: JobStage): ModelTier => stage === 'patch' ? (tier === 'ultra' ? 'ultra' : 'super') : stage === 'review' ? 'lightning' : tier;
function repositoryBinding(project: ReviewProject): RepositoryBinding {
  const [owner,name] = project.repository.split('/');
  // Privacy is refreshed by readSnapshot; never infer it from a client field.
  return { installationId: project.installationId, repositoryId: project.repositoryId, owner, name, defaultBranch: project.defaultBranch };
}
export function createReviewService(options: ServiceOptions) {
  const { store, userId } = options; const env = options.env ?? process.env;
  const secret = () => { if (!env.REVIEW_WORKER_SECRET || env.REVIEW_WORKER_SECRET.length < 32) throw new ReviewAccessError(503,'WORKER_NOT_CONFIGURED','The trusted review worker is awaiting configuration.'); return env.REVIEW_WORKER_SECRET; };
  const github = () => options.github ?? createGitHubClient(env);
  const sandbox = () => options.sandbox ?? createNebiusSandbox(env);
  const actions = () => options.actions ?? createActionsRunner(env);
  async function step(organizationId: string, jobId: string): Promise<ReviewJob> {
    const existing = await store.getJob(organizationId, jobId);
    if (['completed','failed','cancelled'].includes(existing.status)) return existing;
    const { job, checkpoint, leaseToken } = await store.claimJob(organizationId, jobId, secret());
    const cp = checkpoint as Checkpoint;
    let charged = 0;
    const complete = (status: JobCompletion['status'], message: string, change?: JobCompletion['change']) => store.completeJob(organizationId, jobId, { leaseToken,status,message,checkpoint:cp,spentCents:charged,...(change ? {change} : {}) }, secret());
    const beginExternal = async (label: string) => { cp.inFlight=label; await store.saveCheckpoint(organizationId,jobId,leaseToken,cp,secret()); };
    try {
      if (cp.inFlight) {
        charged = job.reservedCents;
        throw new ReviewEngineError('PREVIOUS_ATTEMPT_UNCERTAIN','A previous external call did not record its result. This attempt will not be repeated automatically. Inspect provider activity before starting a new stage.',409);
      }
      const context = await store.getChangeContext(organizationId, job.changeId);
      if (context.laptop.evidenceVersion !== context.change.evidenceVersion) throw new ReviewEngineError('STALE_EVIDENCE','Laptop evidence changed. Investigate the current evidence before continuing.',409);
      const evidence = focusedEvidence(context); const digest = evidenceDigest(evidence);
      if (cp.evidenceHash && cp.evidenceHash !== digest) throw new ReviewEngineError('STALE_EVIDENCE','The evidence no longer matches this job. Start a new investigation.',409);
      cp.evidenceHash=digest; cp.evidenceVersion=context.change.evidenceVersion;
      const modelTier = tierFor(context.change.modelTier, job.stage);
      if (job.stage === 'investigate') {
        await beginExternal('nebius-investigation');
        charged=job.reservedCents;
        const {usage,...investigation} = await (options.investigate ?? investigateChange)({title:context.change.title,evidence,modelTier},{env});
        if (usage.estimatedCostCents > job.reservedCents) throw new ReviewEngineError('USAGE_RESERVATION_EXCEEDED','Reported model usage exceeded the stage reservation. Stop and inspect the provider usage before retrying.',409);
        charged=usage.estimatedCostCents; delete cp.inFlight;
        const status = investigation.classification === 'hardware' ? 'hardware_review' : investigation.classification === 'insufficient_evidence' ? 'needs_evidence' : 'open';
        return complete('completed','Nebius investigation recorded.',{investigation,status});
      }
      if (job.stage === 'patch') {
        if (context.change.investigation?.classification !== 'software') throw new ReviewEngineError('SOFTWARE_EVIDENCE_REQUIRED','Only a software investigation can proceed to a code patch.',409);
        if (!context.project) throw new ReviewEngineError('PROJECT_REQUIRED','Connect a project to this recovery change before generating a patch.',409);
        if (!cp.snapshot) {
          // Snapshotting and inference use separate requests to stay inside serverless deadlines.
          cp.snapshot=await github().readSnapshot(repositoryBinding(context.project),context.project.targetPath,context.project.testPaths);
          return complete('waiting','Repository snapshot saved. Continue to ask Nemotron for the patch.');
        }
        await beginExternal('nebius-patch'); charged=job.reservedCents;
        const candidate=await (options.propose ?? proposePatch)({title:context.change.title,evidence,snapshot:cp.snapshot,modelTier},{env});
        if (candidate.usage.estimatedCostCents > job.reservedCents) throw new ReviewEngineError('USAGE_RESERVATION_EXCEEDED','Reported model usage exceeded the stage reservation. Stop and inspect provider usage before retrying.',409);
        charged=candidate.usage.estimatedCostCents; cp.candidate=candidate; delete cp.inFlight;
        delete cp.verification; delete cp.review; delete cp.actions; delete cp.baseline; delete cp.baselineReceipt; delete cp.candidateReceipt;
        return complete('completed','Proposed patch saved. It has not passed tests yet.',{status:'patch_ready',baseCommit:cp.snapshot.baseSha,patchHash:candidate.hash,patch:displayPatch(cp.snapshot,candidate),verification:null,reviewSummary:null});
      }
      if (!cp.snapshot || !cp.candidate) throw new ReviewEngineError('PATCH_REQUIRED','Generate a patch for this exact evidence before continuing.',409);
      if (job.stage === 'verify') {
        cp.backend ??= env.NEBIUS_SANDBOX_IMAGE_ID ? 'nebius' : 'actions';
        if (cp.backend === 'actions') {
          if (!cp.actions) {
            await beginExternal('actions-dispatch');
            cp.actions=await actions().startActionsVerification(cp.snapshot,cp.candidate,digest); delete cp.inFlight;
            return complete('waiting','Isolated GitHub verification started. Check progress to retrieve the result.');
          }
          const result=await actions().pollActionsVerification(cp.actions);
          if (result.status === 'pending') return complete('waiting',result.message);
          if (result.status === 'failed') throw new ReviewEngineError('TESTS_FAILED',result.message,409);
          cp.verification=result.proof;
        } else {
          if (!cp.baselineReceipt) {
            await beginExternal('nebius-baseline');
            cp.baselineReceipt=await sandbox().startVerification({snapshot:cp.snapshot,evidenceHash:digest}); delete cp.inFlight;
            return complete('waiting','Failing baseline submitted to Nebius Sandboxes. Check progress to continue.');
          }
          if (!cp.baseline) {
            const baseline=await sandbox().pollVerification(cp.baselineReceipt);
            if (baseline.status === 'pending') return complete('waiting',baseline.message);
            if (baseline.status !== 'failed' || baseline.failed < 1) throw new ReviewEngineError('BASELINE_NOT_REPRODUCED','The original snapshot did not reproduce a failing diagnostic test. No passing fix is claimed.',409);
            cp.baseline=baseline;
            return complete('waiting','Baseline failure reproduced. Continue to test the candidate.');
          }
          if (!cp.candidateReceipt) {
            await beginExternal('nebius-candidate');
            cp.candidateReceipt=await sandbox().startVerification({snapshot:cp.snapshot,evidenceHash:digest,candidate:cp.candidate}); delete cp.inFlight;
            return complete('waiting','Candidate submitted to Nebius Sandboxes. Check progress to retrieve the result.');
          }
          const candidate=await sandbox().pollVerification(cp.candidateReceipt);
          if (candidate.status === 'pending') return complete('waiting',candidate.message);
          cp.verification=buildVerificationProof(cp.snapshot,cp.candidate,cp.baselineReceipt,cp.baseline,cp.candidateReceipt,candidate);
        }
        const proof=cp.verification;
        return complete('completed','A failing baseline and passing candidate were verified in isolation.',{status:'patch_ready',verification:{status:'passed',baselineFailed:true,candidatePassed:true,provider:proof.provider ?? 'Nebius Sandboxes',summary:`Baseline: ${proof.baselineFailed} failed; candidate: ${proof.candidatePassed} passed. This covers the selected diagnostic tests.`,evidenceHash:digest,baseCommit:cp.snapshot.baseSha,patchHash:cp.candidate.hash,checkedAt:proof.completedAt}});
      }
      if (!cp.verification) throw new ReviewEngineError('VERIFICATION_REQUIRED','Complete isolated baseline and candidate tests before review or publication.',409);
      if (job.stage === 'review') {
        await beginExternal('nebius-independent-review'); charged=job.reservedCents;
        const review=await (options.review ?? reviewCandidate)({snapshot:cp.snapshot,candidate:cp.candidate,verification:cp.verification,modelTier:'lightning'},{env});
        if (review.usage.estimatedCostCents > job.reservedCents) throw new ReviewEngineError('USAGE_RESERVATION_EXCEEDED','Reported model usage exceeded the stage reservation. Stop and inspect provider usage before retrying.',409);
        cp.review=review; charged=review.usage.estimatedCostCents; delete cp.inFlight;
        return complete(review.approved?'completed':'failed',review.approved?'Independent model review complete. A different organization member must approve.':'The independent model reviewer requested changes.',{status:review.approved?'awaiting_approval':'failed',reviewSummary:review.reasons.join('\n')});
      }
      if (!cp.review?.approved || !context.change.approval) throw new ReviewEngineError('APPROVAL_REQUIRED','An independent model review and a different human reviewer are required.',409);
      const approval=context.change.approval;
      if (approval.evidenceVersion !== context.change.evidenceVersion || approval.baseCommit !== cp.snapshot.baseSha || approval.patchHash !== cp.candidate.hash) throw new ReviewEngineError('STALE_APPROVAL','The approval does not match this tested patch.',409);
      await beginExternal('github-publication');
      // This capability only creates a draft. Repository merge review remains on GitHub.
      const published=await github().publishDraft({snapshot:cp.snapshot,candidate:cp.candidate,verification:cp.verification,review:cp.review,changeId:context.change.id,title:context.change.title,currentEvidenceHash:digest,approval:{approvedBy:approval.userId,requestedBy:context.change.createdBy,candidateHash:cp.candidate.hash,evidenceHash:digest,snapshotHash:cp.snapshot.hash}});
      delete cp.inFlight;
      return complete('completed','Tested draft pull request created. Repository review is still required.',{status:'published',draftPrUrl:published.url});
    } catch (error) {
      const message=error instanceof ReviewEngineError || error instanceof ReviewAccessError ? error.message : 'This stage could not be completed. No successful result was accepted.';
      // Unknown/failed model calls keep their reservation charge; automatic retries never spend it twice.
      return complete('failed',message,{status:'failed'});
    }
  }
  return async (action: ReviewAction): Promise<unknown> => {
    switch(action.action) {
      case 'organizations': return store.listOrganizations();
      case 'createOrganization': return store.createOrganization(action.name);
      case 'overview': return store.getOverview(action.organizationId);
      case 'createLaptop': return store.createLaptop(action.organizationId,action);
      case 'addEvidence': return store.addEvidence(action.organizationId,action);
      case 'createChange': return store.createChange(action.organizationId,action);
      case 'createInvite': return store.createInvite(action.organizationId,action.role);
      case 'redeemInvite': return store.redeemInvite(action.token);
      case 'setBudget': return store.setBudget(action.organizationId,action.monthlyBudgetCents);
      case 'approveChange': return store.approveChange(action.organizationId,action);
      case 'cancelJob': return store.cancelJob(action.organizationId,action.jobId);
      case 'resumeJob': return step(action.organizationId,action.jobId);
      case 'connectProject': {
        const org=(await store.listOrganizations()).find(o=>o.id===action.organizationId);
        if (!org || !['owner','admin'].includes(org.role)) throw new ReviewAccessError(403,'ACCESS_DENIED','An organization owner or administrator must connect repositories.');
        const repo=await github().discoverRepository(action.installationId,action.repository,action.githubUserToken);
        if (repo.isPrivate !== false) throw new ReviewEngineError('PRIVATE_RUNNER_REQUIRED','This verification pilot accepts public diagnostic repositories only. Private source requires a dedicated, approved private runner.',409);
        return store.connectProject(action.organizationId,{repository:`${repo.owner}/${repo.name}`,repositoryId:repo.repositoryId,installationId:repo.installationId,defaultBranch:repo.defaultBranch,targetPath:action.targetPath,testPaths:action.testPaths},secret());
      }
      case 'runJob': {
        const context=await store.getChangeContext(action.organizationId,action.changeId);
        const tier=tierFor(context.change.modelTier,action.stage);
        const amount=['investigate','patch','review'].includes(action.stage)?stageReservationCents(tier,action.stage as 'investigate'|'patch'|'review'):0;
        const job=await store.reserveJob(action.organizationId,action.changeId,action.stage,action.idempotencyKey,amount,secret());
        return step(action.organizationId,job.id);
      }
    }
  };
}
export async function executeReviewAction(action: ReviewAction, auth: Auth, env: ReviewEnvironment): Promise<unknown> {
  return createReviewService({store:new ReviewStore(auth.client,auth.userId),userId:auth.userId,env})(action);
}
