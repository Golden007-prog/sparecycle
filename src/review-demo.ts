import type { RecoveryChange, ReviewOverview } from '../lib/review/types';

const organizationId = 'demo-organization';
const createdAt = '2026-10-10T08:30:00.000Z';
const base: Omit<RecoveryChange, 'id' | 'laptopId' | 'title' | 'description' | 'status'> = {
  organizationId, projectId: 'demo-project', evidenceVersion: 1, modelTier: 'lightning', createdBy: 'demo-technician', createdAt,
  updatedAt: createdAt, investigation: null, verification: null, approval: null, baseCommit: null, patchHash: null,
  patch: null, reviewSummary: null, draftPrUrl: null,
};

/** Browsable fixtures only. No executed model, approval, test or publication is implied. */
export const demoOverview: ReviewOverview = {
  organization: { id: organizationId, name: 'Second Life Workshop', role: 'viewer', monthlyBudgetCents: 1000, spentCents: 0, reservedCents: 0, createdAt },
  laptops: [
    { id: 'demo-laptop-1', organizationId, assetTag: 'Bench 014', manufacturer: 'Lenovo', model: 'ThinkPad T480', operatingSystem: 'Ubuntu 24.04', status: 'held', evidenceVersion: 1, createdAt },
    { id: 'demo-laptop-2', organizationId, assetTag: 'Bench 021', manufacturer: 'Dell', model: 'Latitude 5490', operatingSystem: 'Windows 11', status: 'held', evidenceVersion: 1, createdAt },
    { id: 'demo-laptop-3', organizationId, assetTag: 'Bench 028', manufacturer: 'HP', model: 'EliteBook 840 G5', operatingSystem: 'Ubuntu 24.04', status: 'active', evidenceVersion: 1, createdAt },
  ],
  evidence: [
    { id: 'demo-evidence-1', organizationId, laptopId: 'demo-laptop-1', version: 1, kind: 'diagnostic_log', content: 'Synthetic observation: a battery report contains "design_capacity_mwh": 48000 and "full_charge_capacity_mwh": 36000. The sample parser shows 0% health. Expected calculation: 36000 / 48000 × 100 = 75%. This observation is a software test case, not a measured battery assessment.', source: 'Synthetic parser fixture', createdBy: 'demo-technician', createdAt },
    { id: 'demo-evidence-2', organizationId, laptopId: 'demo-laptop-2', version: 1, kind: 'technician_note', content: 'Synthetic intake note: the removable memory module is absent. The laptop fails the bench intake check. A compatible replacement and a physical technician check would be required. A software patch cannot supply a missing component.', source: 'Synthetic bench note', createdBy: 'demo-technician', createdAt },
    { id: 'demo-evidence-3', organizationId, laptopId: 'demo-laptop-3', version: 1, kind: 'technician_note', content: 'Synthetic intake note: user reports an intermittent fan noise. No temperature readings, load conditions, diagnostic logs or repeatable reproduction have been supplied. More evidence is needed before choosing an intervention.', source: 'Synthetic intake note', createdBy: 'demo-technician', createdAt },
  ],
  projects: [{ id: 'demo-project', organizationId, name: 'Battery diagnostics example', repository: 'example/battery-diagnostics', repositoryId: 1, installationId: 0, defaultBranch: 'main', targetPath: 'src/diagnostics/battery.mjs', testPaths: ['tests/diagnostics/battery.test.mjs'], verificationProfile: 'node-diagnostics-v1', connectionStatus: 'pending', createdAt }],
  changes: [
    { ...base, id: 'sample-rcr-001', laptopId: 'demo-laptop-1', title: 'A healthy battery reading is lost in the parser', description: 'Investigate a diagnostics parser that turns a 75% battery health ratio into 0%. A software change should reproduce the calculation failure first, pass the existing test in isolation, and reach a separate reviewer before a draft PR.', status: 'open' },
    { ...base, id: 'sample-rcr-002', laptopId: 'demo-laptop-2', projectId: null, title: 'Missing memory needs a physical repair', description: 'Review an intake observation about a missing memory module. This case should stay with the workshop and compatible stock; a code change would not resolve the physical problem.', status: 'open' },
    { ...base, id: 'sample-rcr-003', laptopId: 'demo-laptop-3', projectId: null, title: 'Collect evidence before diagnosing fan noise', description: 'An intermittent symptom has no reproducible conditions or diagnostic log. The next useful action is to collect evidence, not to propose a confident repair.', status: 'open' },
  ],
  jobs: [], audit: [], members: [],
};
