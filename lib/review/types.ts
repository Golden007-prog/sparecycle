/** Public Review contract. Provider credentials and worker checkpoints never belong here. */
export type ReviewRole = 'owner' | 'admin' | 'reviewer' | 'technician' | 'viewer';
export type ModelTier = 'nano' | 'lightning' | 'super' | 'ultra';
export type ChangeStatus = 'open' | 'investigating' | 'needs_evidence' | 'hardware_review' | 'patch_ready' | 'testing' | 'awaiting_approval' | 'approved' | 'published' | 'failed' | 'cancelled';
export type JobStage = 'investigate' | 'patch' | 'verify' | 'review' | 'publish';
export type JobStatus = 'queued' | 'running' | 'waiting' | 'completed' | 'failed' | 'cancelled';
export interface ReviewOrganization { id: string; name: string; role: ReviewRole; monthlyBudgetCents: number; spentCents: number; reservedCents: number; createdAt: string }
export interface LaptopPassport { id: string; organizationId: string; assetTag: string; manufacturer: string; model: string; operatingSystem: string; status: 'active' | 'held' | 'retired'; evidenceVersion: number; createdAt: string }
export interface LaptopEvidence { id: string; organizationId: string; laptopId: string; version: number; kind: 'technician_note' | 'diagnostic_log' | 'test_result'; content: string; source: string; createdBy: string; createdAt: string }
export interface ReviewProject { id: string; organizationId: string; name: string; repository: string; repositoryId: number; installationId: number; defaultBranch: string; targetPath: string; testPaths: string[]; verificationProfile: 'node-diagnostics-v1'; connectionStatus: 'pending' | 'connected'; createdAt: string }
export interface ReviewFinding { severity: 'info' | 'warning' | 'critical'; title: string; detail: string }
export interface ChangeInvestigation { classification: 'software' | 'hardware' | 'insufficient_evidence'; summary: string; findings: ReviewFinding[]; nextSteps: string[]; model: string; traceId?: string }
export interface ChangeVerification { status: 'pending' | 'passed' | 'failed' | 'unavailable'; baselineFailed: boolean; candidatePassed: boolean; provider: string; summary: string; evidenceHash: string; baseCommit: string; patchHash: string; checkedAt: string }
export interface ChangeApproval { userId: string; evidenceVersion: number; baseCommit: string; patchHash: string; createdAt: string }
export interface RecoveryChange { id: string; organizationId: string; laptopId: string; projectId: string | null; title: string; description: string; status: ChangeStatus; evidenceVersion: number; modelTier: ModelTier; createdBy: string; createdAt: string; updatedAt: string; investigation: ChangeInvestigation | null; verification: ChangeVerification | null; approval: ChangeApproval | null; baseCommit: string | null; patchHash: string | null; patch: string | null; reviewSummary: string | null; draftPrUrl: string | null }
export interface ReviewJob { id: string; organizationId: string; changeId: string; stage: JobStage; status: JobStatus; createdBy: string; createdAt: string; updatedAt: string; message: string; reservedCents: number }
export interface ReviewAuditEvent { id: string; organizationId: string; actorId: string; action: string; subjectId: string | null; createdAt: string; details: Record<string, unknown> }
export interface ReviewMember { userId: string; role: ReviewRole; joinedAt: string }
export interface ReviewOverview { organization: ReviewOrganization; laptops: LaptopPassport[]; evidence: LaptopEvidence[]; projects: ReviewProject[]; changes: RecoveryChange[]; jobs: ReviewJob[]; audit: ReviewAuditEvent[]; members: ReviewMember[] }
export interface ReviewSsoProvider { id: `custom:${string}`; label: string }
export interface ReviewConfig { version: '2'; authConfigured: boolean; googleSignInEnabled?: boolean; ssoProvider?: ReviewSsoProvider | null; supabaseUrl: string | null; supabasePublishableKey: string | null; githubConfigured: boolean; githubInstallUrl: string | null; nebiusConfigured: boolean; sandboxConfigured: boolean; runnerConfigured?: boolean; models: Array<{ tier: ModelTier; id: string; label: string }>; limitations: string[] }
export type ReviewAction =
  | { action: 'organizations' }
  | { action: 'createOrganization'; name: string }
  | { action: 'overview'; organizationId: string }
  | { action: 'createLaptop'; organizationId: string; assetTag: string; manufacturer: string; model: string; operatingSystem: string }
  | { action: 'addEvidence'; organizationId: string; laptopId: string; kind: LaptopEvidence['kind']; content: string; source: string }
  | { action: 'connectProject'; organizationId: string; repository: string; installationId: number; targetPath: string; testPaths: string[]; githubUserToken: string }
  | { action: 'createChange'; organizationId: string; laptopId: string; projectId: string | null; title: string; description: string; modelTier: ModelTier }
  | { action: 'runJob'; organizationId: string; changeId: string; stage: JobStage; idempotencyKey: string }
  | { action: 'resumeJob'; organizationId: string; jobId: string }
  | { action: 'cancelJob'; organizationId: string; jobId: string }
  | { action: 'approveChange'; organizationId: string; changeId: string; evidenceVersion: number; baseCommit: string; patchHash: string }
  | { action: 'createInvite'; organizationId: string; role: Exclude<ReviewRole, 'owner'> }
  | { action: 'redeemInvite'; token: string }
  | { action: 'setBudget'; organizationId: string; monthlyBudgetCents: number };
export interface ReviewErrorBody { error: string; code: string; requestId?: string }
