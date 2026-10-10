import { z } from 'zod';

const id = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/, 'Use a short identifier containing letters, digits, dots, colons, underscores, or hyphens.');
const label = z.string().trim().min(1).max(160);

export const compatibilityEvidenceSchema = z.object({
  id,
  title: label,
  detail: z.string().trim().min(1).max(1600),
  url: z.string().url().refine(value => /^https?:\/\//.test(value), 'Evidence links must use HTTP or HTTPS.').optional(),
  kind: z.enum(['demo', 'manufacturer', 'technician']),
}).strict();

export const recoveryDeviceSchema = z.object({
  id,
  label,
  model: label,
  /** Each occurrence requests one unit of that exact approved SKU. */
  needs: z.array(id).min(1).max(6),
  repairMinutes: z.number().int().min(1).max(600),
  priority: z.number().int().min(0).max(10),
  eligible: z.boolean(),
  holdReason: z.string().trim().min(1).max(500).optional(),
  intakeNote: z.string().max(1200),
  qaRequired: z.boolean(),
}).strict().superRefine((device, context) => {
  if (!device.eligible && !device.holdReason) context.addIssue({ code: 'custom', path: ['holdReason'], message: 'An ineligible device needs a hold reason.' });
});

export const recoveryPartSchema = z.object({
  id,
  sku: id,
  label,
  source: z.enum(['stock', 'donor', 'purchase']),
  donorId: id.optional(),
  quantity: z.number().int().min(0).max(100),
  /** Incremental cash cost per unit; existing stock can be recorded at zero. */
  costCents: z.number().int().min(0).max(1_000_000),
  /** Additional inspection/harvest preparation minutes per unit. */
  harvestMinutes: z.number().int().min(0).max(600),
  verified: z.boolean(),
  evidenceId: id,
}).strict().superRefine((part, context) => {
  if (part.source === 'donor' && !part.donorId) context.addIssue({ code: 'custom', path: ['donorId'], message: 'A donor part needs a donor device identifier.' });
  if (part.source !== 'donor' && part.donorId) context.addIssue({ code: 'custom', path: ['donorId'], message: 'Only donor parts may name a donor device.' });
});

export const recoveryBatchSchema = z.object({
  id,
  name: label,
  devices: z.array(recoveryDeviceSchema).min(1).max(18),
  parts: z.array(recoveryPartSchema).max(40),
  evidence: z.array(compatibilityEvidenceSchema).max(40),
}).strict().superRefine((batch, context) => {
  for (const key of ['devices', 'parts', 'evidence'] as const) {
    const seen = new Set<string>();
    batch[key].forEach((item, index) => {
      if (seen.has(item.id)) context.addIssue({ code: 'custom', path: [key, index, 'id'], message: `Duplicate ${key} identifier.` });
      seen.add(item.id);
    });
  }
  const evidence = new Set(batch.evidence.map(item => item.id));
  const devices = new Set(batch.devices.map(item => item.id));
  batch.parts.forEach((part, index) => {
    if (!evidence.has(part.evidenceId)) context.addIssue({ code: 'custom', path: ['parts', index, 'evidenceId'], message: 'The referenced compatibility evidence is missing.' });
    if (part.donorId && devices.has(part.donorId)) context.addIssue({ code: 'custom', path: ['parts', index, 'donorId'], message: 'A donor device cannot also be a repair candidate in this batch.' });
  });
});

export const recoveryLimitsSchema = z.object({
  budgetCents: z.number().int().min(0).max(1_000_000),
  technicianMinutes: z.number().int().min(0).max(10_000),
  unavailablePartIds: z.array(id).max(40),
}).strict();

export type RecoveryDevice = z.infer<typeof recoveryDeviceSchema>;
export type RecoveryPart = z.infer<typeof recoveryPartSchema>;
export type CompatibilityEvidence = z.infer<typeof compatibilityEvidenceSchema>;
export type RecoveryBatch = z.infer<typeof recoveryBatchSchema>;
export type RecoveryLimits = z.infer<typeof recoveryLimitsSchema>;
export interface PartAllocation { partId: string; sku: string; quantity: number }
export interface RecoveryAssignment { deviceId: string; allocations: PartAllocation[]; costCents: number; minutes: number }
export interface RecoverySummary { recovered: number; costCents: number; minutes: number; reusedParts: number }
export interface RecoveryPlan {
  assignments: RecoveryAssignment[];
  unresolved: { deviceId: string; reasons: string[] }[];
  summary: RecoverySummary;
  baseline: RecoverySummary;
  optimal: boolean;
  exploredStates: number;
  warnings: string[];
}

export type Batch = RecoveryBatch;
export type Device = RecoveryDevice;
export type Part = RecoveryPart;
export type Evidence = CompatibilityEvidence;
export type Limits = RecoveryLimits;
