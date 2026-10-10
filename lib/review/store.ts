import type { SupabaseClient } from '@supabase/supabase-js';
import type { JobStage, LaptopEvidence, LaptopPassport, RecoveryChange, ReviewAuditEvent, ReviewJob, ReviewMember, ReviewOrganization, ReviewOverview, ReviewProject, ReviewRole, ModelTier } from './types.js';

export class ReviewStoreError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message); this.name = 'ReviewStoreError';
  }
}

type Row = Record<string, any>;
type DbError = { code?: string; message?: string };
function safeError(error: DbError): ReviewStoreError {
  switch (error.code) {
    case '28000': return new ReviewStoreError(401, 'INVALID_SESSION', 'Sign in to continue.');
    case '42501': return new ReviewStoreError(403, 'ACCESS_DENIED', 'Your role cannot perform this action, or a separate reviewer is required.');
    case 'P0002': return new ReviewStoreError(404, 'NOT_FOUND', 'This record or invitation is unavailable.');
    case '40001': case '23505': return new ReviewStoreError(409, 'CONFLICT', 'This record changed or a stage is already running. Refresh and try again.');
    case 'P0001': return new ReviewStoreError(429, 'QUOTA_EXCEEDED', 'The organization or service limit has been reached.');
    case '22023': case '22P02': case '23502': case '23503': case '23514': return new ReviewStoreError(400, 'INVALID_INPUT', 'The request contains an invalid value or linked record.');
    default: return new ReviewStoreError(503, 'DATABASE_UNAVAILABLE', 'The review database is unavailable. Please retry shortly.');
  }
}
function unwrap<T>(result: { data: T | null; error: DbError | null }): T {
  if (result.error) throw safeError(result.error);
  if (result.data === null) throw new ReviewStoreError(404, 'NOT_FOUND', 'This record is unavailable.');
  return result.data;
}
const laptopRecord = (r: Row): LaptopPassport => ({ id:r.id,organizationId:r.organization_id,assetTag:r.asset_tag,manufacturer:r.manufacturer,model:r.model,operatingSystem:r.operating_system,status:r.status,evidenceVersion:r.evidence_version,createdAt:r.created_at });
const evidenceRecord = (r: Row): LaptopEvidence => ({ id:r.id,organizationId:r.organization_id,laptopId:r.laptop_id,version:r.version,kind:r.kind,content:r.content,source:r.source,createdBy:r.created_by,createdAt:r.created_at });
const projectRecord = (r: Row): ReviewProject => ({ id:r.id,organizationId:r.organization_id,name:r.name,repository:r.repository,repositoryId:r.repository_id,installationId:r.installation_id,defaultBranch:r.default_branch,targetPath:r.target_path,testPaths:r.test_paths,verificationProfile:r.verification_profile,connectionStatus:r.connection_status,createdAt:r.created_at });
const changeRecord = (r: Row): RecoveryChange => ({ id:r.id,organizationId:r.organization_id,laptopId:r.laptop_id,projectId:r.project_id,title:r.title,description:r.description,status:r.status,evidenceVersion:r.evidence_version,modelTier:r.model_tier,createdBy:r.created_by,createdAt:r.created_at,updatedAt:r.updated_at,investigation:r.investigation,verification:r.verification,approval:r.approval,baseCommit:r.base_commit,patchHash:r.patch_hash,patch:r.patch,reviewSummary:r.review_summary,draftPrUrl:r.draft_pr_url });
const jobRecord = (r: Row): ReviewJob => ({ id:r.id,organizationId:r.organization_id,changeId:r.change_id,stage:r.stage,status:r.status,createdBy:r.created_by,createdAt:r.created_at,updatedAt:r.updated_at,message:r.message,reservedCents:r.reserved_cents });
const auditRecord = (r: Row): ReviewAuditEvent => ({ id:r.id,organizationId:r.organization_id,actorId:r.actor_id,action:r.action,subjectId:r.subject_id,createdAt:r.created_at,details:r.details });

export interface JobCompletion {
  leaseToken: string;
  status: 'waiting' | 'completed' | 'failed';
  message: string;
  checkpoint?: Record<string, unknown>;
  spentCents: number;
  change?: Partial<Pick<RecoveryChange, 'status' | 'investigation' | 'verification' | 'baseCommit' | 'patchHash' | 'patch' | 'reviewSummary' | 'draftPrUrl'>>;
}
export interface ReviewChangeContext { change: RecoveryChange; laptop: LaptopPassport; evidence: LaptopEvidence[]; project: ReviewProject | null }

/** The supplied client must carry the caller's verified JWT; this class never creates an admin client. */
export class ReviewStore {
  constructor(private readonly client: SupabaseClient, private readonly userId: string) {}

  private async mutate(action: string, organizationId: string | null, data: Record<string, unknown>, secret?: string): Promise<Row> {
    return unwrap(await this.client.rpc('review_mutate', { p_action:action,p_org:organizationId,p_data:data,p_secret:secret ?? null })) as Row;
  }
  private async rows(table: string, organizationId: string, limit = 200, orderBy = 'created_at'): Promise<Row[]> {
    return unwrap(await this.client.from(table).select('*').eq('organization_id',organizationId).order(orderBy,{ascending:false}).limit(limit)) as Row[];
  }
  private async organization(id: string): Promise<ReviewOrganization> {
    const [orgResult, membershipResult, budgetResult] = await Promise.all([
      this.client.from('review_organizations').select('*').eq('id',id).maybeSingle(),
      this.client.from('review_memberships').select('role').eq('organization_id',id).eq('user_id',this.userId).maybeSingle(),
      this.client.from('review_budgets').select('spent_cents,reserved_cents').eq('organization_id',id).eq('period',`${new Date().toISOString().slice(0,7)}-01`).maybeSingle(),
    ]);
    const org = unwrap(orgResult) as Row;
    const membership = unwrap(membershipResult) as Row;
    if (budgetResult.error) throw safeError(budgetResult.error);
    const budget = budgetResult.data as Row | null;
    return { id:org.id,name:org.name,role:membership.role,monthlyBudgetCents:org.monthly_budget_cents,spentCents:budget?.spent_cents ?? 0,reservedCents:budget?.reserved_cents ?? 0,createdAt:org.created_at };
  }
  async listOrganizations(): Promise<ReviewOrganization[]> {
    const rows = unwrap(await this.client.from('review_organizations').select('id').order('created_at').limit(50)) as Row[];
    return Promise.all(rows.map(row => this.organization(row.id)));
  }
  async createOrganization(name: string): Promise<ReviewOrganization> {
    const row = await this.mutate('createOrganization',null,{name});
    return this.organization(row.id);
  }
  async getOverview(organizationId: string): Promise<ReviewOverview> {
    const organization = await this.organization(organizationId);
    const [laptops,evidence,projects,changes,jobs,audit,members] = await Promise.all([
      this.rows('review_laptops',organizationId),this.rows('review_evidence',organizationId,500),this.rows('review_projects',organizationId),
      this.rows('review_changes',organizationId),this.rows('review_jobs',organizationId),
      this.client.from('review_audit').select('*').eq('organization_id',organizationId).order('created_at',{ascending:false}).limit(100).then(r=>unwrap(r) as Row[]),
      this.rows('review_memberships',organizationId,200,'joined_at'),
    ]);
    return { organization,laptops:laptops.map(laptopRecord),evidence:evidence.map(evidenceRecord),projects:projects.map(projectRecord),changes:changes.map(changeRecord),jobs:jobs.map(jobRecord),audit:audit.map(auditRecord),members:members.map((r):ReviewMember=>({userId:r.user_id,role:r.role,joinedAt:r.joined_at})) };
  }
  async createLaptop(organizationId: string, input: { assetTag: string; manufacturer: string; model: string; operatingSystem: string }): Promise<LaptopPassport> {
    return laptopRecord(await this.mutate('createLaptop',organizationId,input));
  }
  async addEvidence(organizationId: string, input: { laptopId: string; kind: LaptopEvidence['kind']; content: string; source: string }): Promise<LaptopEvidence> {
    return evidenceRecord(await this.mutate('addEvidence',organizationId,input));
  }
  async connectProject(organizationId: string, input: { repository: string; repositoryId: number; installationId: number; defaultBranch: string; targetPath: string; testPaths: string[] }, workerSecret: string): Promise<ReviewProject> {
    return projectRecord(await this.mutate('connectProject',organizationId,input,workerSecret));
  }
  async createChange(organizationId: string, input: { laptopId: string; projectId: string | null; title: string; description: string; modelTier: ModelTier }): Promise<RecoveryChange> {
    return changeRecord(await this.mutate('createChange',organizationId,input));
  }
  async getChangeContext(organizationId: string, changeId: string): Promise<ReviewChangeContext> {
    const row = unwrap(await this.client.from('review_changes').select('*').eq('organization_id',organizationId).eq('id',changeId).maybeSingle()) as Row;
    const [laptop,evidence,project] = await Promise.all([
      this.client.from('review_laptops').select('*').eq('organization_id',organizationId).eq('id',row.laptop_id).maybeSingle().then(r=>unwrap(r) as Row),
      this.client.from('review_evidence').select('*').eq('organization_id',organizationId).eq('laptop_id',row.laptop_id).lte('version',row.evidence_version).order('version',{ascending:false}).limit(50).then(r=>unwrap(r) as Row[]),
      row.project_id ? this.client.from('review_projects').select('*').eq('organization_id',organizationId).eq('id',row.project_id).maybeSingle().then(r=>unwrap(r) as Row) : Promise.resolve(null),
    ]);
    return { change:changeRecord(row),laptop:laptopRecord(laptop),evidence:evidence.map(evidenceRecord),project:project ? projectRecord(project) : null };
  }
  async getJob(organizationId: string, jobId: string): Promise<ReviewJob> {
    return jobRecord(unwrap(await this.client.from('review_jobs').select('*').eq('organization_id',organizationId).eq('id',jobId).maybeSingle()) as Row);
  }
  async reserveJob(organizationId: string, changeId: string, stage: JobStage, idempotencyKey: string, reservedCents: number, workerSecret: string): Promise<ReviewJob> {
    return jobRecord(await this.mutate('reserveJob',organizationId,{changeId,stage,idempotencyKey,reservedCents},workerSecret));
  }
  async claimJob(organizationId: string, jobId: string, workerSecret: string): Promise<{ job: ReviewJob; checkpoint: Record<string, unknown>; leaseToken: string }> {
    const result = await this.mutate('claimJob',organizationId,{jobId},workerSecret);
    return { job:jobRecord(result.job),checkpoint:result.checkpoint,leaseToken:result.leaseToken };
  }
  async completeJob(organizationId: string, jobId: string, result: JobCompletion, workerSecret: string): Promise<ReviewJob> {
    return jobRecord(await this.mutate('completeJob',organizationId,{jobId,...result},workerSecret));
  }
  async saveCheckpoint(organizationId: string, jobId: string, leaseToken: string, checkpoint: Record<string, unknown>, workerSecret: string): Promise<void> {
    await this.mutate('saveCheckpoint',organizationId,{jobId,leaseToken,checkpoint},workerSecret);
  }
  async cancelJob(organizationId: string, jobId: string): Promise<ReviewJob> {
    return jobRecord(await this.mutate('cancelJob',organizationId,{jobId}));
  }
  async approveChange(organizationId: string, input: { changeId: string; evidenceVersion: number; baseCommit: string; patchHash: string }): Promise<RecoveryChange> {
    return changeRecord(await this.mutate('approveChange',organizationId,input));
  }
  async createInvite(organizationId: string, role: Exclude<ReviewRole,'owner'>): Promise<{ token: string; expiresAt: string }> {
    const result = await this.mutate('createInvite',organizationId,{role});
    return { token:result.token,expiresAt:result.expiresAt };
  }
  async redeemInvite(token: string): Promise<ReviewOrganization> {
    const result = await this.mutate('redeemInvite',null,{token});
    return this.organization(result.id);
  }
  async setBudget(organizationId: string, monthlyBudgetCents: number): Promise<ReviewOrganization> {
    await this.mutate('setBudget',organizationId,{monthlyBudgetCents});
    return this.organization(organizationId);
  }
}
