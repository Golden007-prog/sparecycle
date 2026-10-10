import { z } from 'zod';
import { recoveryBatchSchema, recoveryLimitsSchema, type RecoveryBatch, type RecoveryLimits } from './recovery-types';

export const WORKSPACE_STORAGE_KEY = 'sparecycle.workspaces.v1';
export const MAX_WORKSPACES = 8;
export const MAX_SAVED_BATCHES = 20;
const id = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/);
export const companyProfileSchema = z.object({
  name: z.string().trim().min(1, 'Enter a company or organization name.').max(100),
  site: z.string().trim().max(100),
  type: z.enum(['refurbisher', 'school', 'community']),
  defaultBudgetCents: z.number().int().min(0).max(1_000_000),
  defaultTechnicianMinutes: z.number().int().min(0).max(10_000),
}).strict();
const savedBatchSchema = z.object({
  id,
  batch: recoveryBatchSchema,
  limits: recoveryLimitsSchema,
  savedAt: z.string().datetime(),
}).strict().superRefine((saved, context) => {
  const parts = new Set(saved.batch.parts.map(part => part.id));
  if (saved.limits.unavailablePartIds.some(partId => !parts.has(partId))) context.addIssue({ code: 'custom', path: ['limits', 'unavailablePartIds'], message: 'Unavailable parts must belong to their saved batch.' });
});
const companyWorkspaceSchema = z.object({
  id,
  profile: companyProfileSchema,
  activeBatchId: id.nullable(),
  batches: z.array(savedBatchSchema).max(MAX_SAVED_BATCHES),
}).strict().superRefine((workspace, context) => {
  if (new Set(workspace.batches.map(batch => batch.id)).size !== workspace.batches.length) context.addIssue({ code: 'custom', path: ['batches'], message: 'Saved batch identifiers must be unique within a workspace.' });
  if (workspace.batches.length > 0 && workspace.activeBatchId === null) context.addIssue({ code: 'custom', path: ['activeBatchId'], message: 'Select a batch when saved batches exist.' });
  if (workspace.activeBatchId !== null && !workspace.batches.some(batch => batch.id === workspace.activeBatchId)) context.addIssue({ code: 'custom', path: ['activeBatchId'], message: 'The selected batch is missing.' });
});
export const workspaceStoreSchema = z.object({
  version: z.literal(1),
  activeWorkspaceId: id.nullable(),
  workspaces: z.array(companyWorkspaceSchema).max(MAX_WORKSPACES),
}).strict().superRefine((store, context) => {
  if (new Set(store.workspaces.map(workspace => workspace.id)).size !== store.workspaces.length) context.addIssue({ code: 'custom', path: ['workspaces'], message: 'Workspace identifiers must be unique.' });
  if (store.workspaces.length > 0 && store.activeWorkspaceId === null) context.addIssue({ code: 'custom', path: ['activeWorkspaceId'], message: 'Select a company when workspaces exist.' });
  if (store.activeWorkspaceId !== null && !store.workspaces.some(workspace => workspace.id === store.activeWorkspaceId)) context.addIssue({ code: 'custom', path: ['activeWorkspaceId'], message: 'The selected company workspace is missing.' });
});

export type CompanyProfile = z.infer<typeof companyProfileSchema>;
export type SavedBatch = z.infer<typeof savedBatchSchema>;
export type CompanyWorkspace = z.infer<typeof companyWorkspaceSchema>;
export type WorkspaceStore = z.infer<typeof workspaceStoreSchema>;
export const emptyWorkspaceStore = (): WorkspaceStore => ({ version: 1, activeWorkspaceId: null, workspaces: [] });

export function parseWorkspaceStore(raw: string): WorkspaceStore {
  if (raw.length > 5_000_000) throw new Error('This workspace backup exceeds the browser prototype limit.');
  return workspaceStoreSchema.parse(JSON.parse(raw));
}

export function readWorkspaceRecord(storage: { getItem: (key: string) => string | null }): { store: WorkspaceStore; recoveryRaw: string | null } {
  const raw = storage.getItem(WORKSPACE_STORAGE_KEY);
  if (raw === null) return { store: emptyWorkspaceStore(), recoveryRaw: null };
  try { return { store: parseWorkspaceStore(raw), recoveryRaw: null }; }
  catch { return { store: emptyWorkspaceStore(), recoveryRaw: raw }; }
}

/** Invalid original data is preserved until an explicit recovery decision clears the pause. */
export function persistWorkspaceRecord(storage: { setItem: (key: string, value: string) => void }, store: WorkspaceStore, recoveryRaw: string | null): boolean {
  if (recoveryRaw !== null) return false;
  storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(store));
  return true;
}

export function getWorkspace(store: WorkspaceStore): CompanyWorkspace | undefined {
  return store.workspaces.find(workspace => workspace.id === store.activeWorkspaceId);
}

export function getSavedBatch(store: WorkspaceStore): SavedBatch | undefined {
  const workspace = getWorkspace(store);
  return workspace?.batches.find(saved => saved.id === workspace.activeBatchId);
}

/** Includes ownership, so matching inventories cannot share a review approval. */
export function workspaceSelectionKey(store: WorkspaceStore): string {
  return `${store.activeWorkspaceId ?? 'demo'}:${getWorkspace(store)?.activeBatchId ?? 'preview'}`;
}

export function addWorkspace(store: WorkspaceStore, workspaceId: string, profile: CompanyProfile): WorkspaceStore {
  if (store.workspaces.some(workspace => workspace.id === workspaceId)) throw new Error('This workspace identifier already exists.');
  return workspaceStoreSchema.parse({ ...store, activeWorkspaceId: workspaceId, workspaces: [...store.workspaces, { id: workspaceId, profile, activeBatchId: null, batches: [] }] });
}

export function updateCompanyProfile(store: WorkspaceStore, profile: CompanyProfile): WorkspaceStore {
  if (!getWorkspace(store)) throw new Error('Set up a company workspace first.');
  return workspaceStoreSchema.parse({ ...store, workspaces: store.workspaces.map(workspace => workspace.id === store.activeWorkspaceId ? { ...workspace, profile } : workspace) });
}

export function saveBatchCopy(store: WorkspaceStore, savedId: string, batch: RecoveryBatch, limits: RecoveryLimits, now = new Date().toISOString()): WorkspaceStore {
  const current = getWorkspace(store);
  if (!current) throw new Error('Set up a company workspace first.');
  if (current.batches.some(saved => saved.id === savedId)) throw new Error('This saved batch identifier already exists.');
  return workspaceStoreSchema.parse({ ...store, workspaces: store.workspaces.map(workspace => workspace.id === current.id ? { ...workspace, activeBatchId: savedId, batches: [...workspace.batches, { id: savedId, batch, limits, savedAt: now }] } : workspace) });
}

/** Update only the selected saved batch. An unsaved demo preview stays unsaved. */
export function updateActiveBatch(store: WorkspaceStore, batch: RecoveryBatch, limits: RecoveryLimits, now = new Date().toISOString()): WorkspaceStore {
  const current = getWorkspace(store), saved = getSavedBatch(store);
  if (!current || !saved) return store;
  const normalizedBatch = recoveryBatchSchema.parse(batch), normalizedLimits = recoveryLimitsSchema.parse(limits);
  if (JSON.stringify(saved.batch) === JSON.stringify(normalizedBatch) && JSON.stringify(saved.limits) === JSON.stringify(normalizedLimits)) return store;
  return workspaceStoreSchema.parse({ ...store, workspaces: store.workspaces.map(workspace => workspace.id === current.id ? { ...workspace, batches: workspace.batches.map(item => item.id === saved.id ? { ...item, batch: normalizedBatch, limits: normalizedLimits, savedAt: now } : item) } : workspace) });
}

export function selectWorkspaceBatch(store: WorkspaceStore, workspaceId: string, savedId?: string): WorkspaceStore {
  const workspace = store.workspaces.find(item => item.id === workspaceId);
  if (!workspace) throw new Error('The requested company workspace does not exist.');
  if (savedId !== undefined && !workspace.batches.some(saved => saved.id === savedId)) throw new Error('The requested batch does not belong to this company workspace.');
  return workspaceStoreSchema.parse({ ...store, activeWorkspaceId: workspaceId, workspaces: store.workspaces.map(item => item.id === workspaceId && savedId !== undefined ? { ...item, activeBatchId: savedId } : item) });
}

export function profileLimits(profile: CompanyProfile): RecoveryLimits {
  return { budgetCents: profile.defaultBudgetCents, technicianMinutes: profile.defaultTechnicianMinutes, unavailablePartIds: [] };
}

export function deleteSavedBatch(store: WorkspaceStore, savedId: string): WorkspaceStore {
  const current = getWorkspace(store);
  if (!current || !current.batches.some(saved => saved.id === savedId)) throw new Error('The batch to remove does not belong to the active company.');
  const batches = current.batches.filter(saved => saved.id !== savedId);
  return workspaceStoreSchema.parse({ ...store, workspaces: store.workspaces.map(workspace => workspace.id === current.id ? { ...workspace, batches, activeBatchId: current.activeBatchId === savedId ? batches[0]?.id ?? null : current.activeBatchId } : workspace) });
}

export function deleteCompanyWorkspace(store: WorkspaceStore, workspaceId: string): WorkspaceStore {
  if (!store.workspaces.some(workspace => workspace.id === workspaceId)) throw new Error('The company workspace to remove does not exist.');
  const workspaces = store.workspaces.filter(workspace => workspace.id !== workspaceId);
  return workspaceStoreSchema.parse({ ...store, workspaces, activeWorkspaceId: store.activeWorkspaceId === workspaceId ? workspaces[0]?.id ?? null : store.activeWorkspaceId });
}

/** Restore a backup as independent local copies; existing records are never replaced. */
export function restoreWorkspaceBackup(store: WorkspaceStore, raw: string, createId: (kind: 'company' | 'saved') => string): WorkspaceStore {
  const backup = parseWorkspaceStore(raw);
  if (backup.workspaces.length === 0) throw new Error('This backup contains no company workspaces.');
  if (store.workspaces.length + backup.workspaces.length > MAX_WORKSPACES) throw new Error(`Restoring this backup would exceed ${MAX_WORKSPACES} company workspaces. Export and remove unneeded local companies first. No records were imported.`);
  const used = new Set(store.workspaces.flatMap(workspace => [workspace.id, ...workspace.batches.map(saved => saved.id)]));
  const freshId = (kind: 'company' | 'saved') => {
    const value = id.parse(createId(kind));
    if (used.has(value)) throw new Error('A generated restore identifier is already in use. Try restoring again.');
    used.add(value);
    return value;
  };
  const workspaceIds = new Map<string, string>();
  const restored = backup.workspaces.map(workspace => {
    const workspaceId = freshId('company');
    workspaceIds.set(workspace.id, workspaceId);
    const batchIds = new Map<string, string>();
    const batches = workspace.batches.map(saved => {
      const savedId = freshId('saved'); batchIds.set(saved.id, savedId);
      return { ...saved, id: savedId };
    });
    return { ...workspace, id: workspaceId, profile: { ...workspace.profile, name: `${workspace.profile.name.slice(0, 89)} (restored)` }, batches, activeBatchId: workspace.activeBatchId ? batchIds.get(workspace.activeBatchId)! : null };
  });
  return workspaceStoreSchema.parse({ ...store, activeWorkspaceId: workspaceIds.get(backup.activeWorkspaceId!)!, workspaces: [...store.workspaces, ...restored] });
}
