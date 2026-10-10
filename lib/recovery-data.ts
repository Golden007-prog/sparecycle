import type { RecoveryBatch, RecoveryLimits } from './recovery-types.js';

/** Explicitly synthetic compatibility approvals, quantities, times, and prices. */
export const sampleRecoveryBatch: RecoveryBatch = {
  id: 'school-recovery-demo',
  name: 'Back-to-learning · October intake',
  evidence: [
    { id: 'demo-d5420-memory', title: 'Demo approval · D5420 memory module', kind: 'demo', detail: 'Synthetic technician-approved mapping: D5420-RAM-8 fits the Dell Latitude 5420 configurations in this fixture. The exact part approval is a demo assumption, not inferred from a memory generation or a manufacturer link.' },
    { id: 'demo-d5420-storage', title: 'Demo approval · D5420 storage assembly', kind: 'demo', detail: 'Synthetic approved D5420-SSD-256 assembly, including its required mounting components. This fixture assumes matching device revision and a technician compatibility check. Storage still requires data sanitization and final testing before release.' },
    { id: 'demo-t480-memory', title: 'Demo approval · T480 memory module', kind: 'demo', detail: 'Synthetic technician-approved mapping for T480-RAM-8 in these specific Lenovo ThinkPad T480 units. Similar-looking parts and DDR generation alone do not establish compatibility.' },
    { id: 'demo-t480-storage', title: 'Demo approval · T480 storage assembly', kind: 'demo', detail: 'Synthetic approved T480-SSD-256 assembly for the declared configuration, including matching carrier. It is not interchangeable with another family solely because both are storage devices.' },
    { id: 'demo-unidentified', title: 'Unresolved identity · loose module', kind: 'demo', detail: 'Identification label is unreadable. Exact revision, condition, and compatibility have not been verified; this stock row must not be allocated.' },
    { id: 'dell-family-reference', title: 'Manufacturer reference · Latitude 5420', kind: 'manufacturer', url: 'https://www.dell.com/support/manuals/en-us/latitude-5420-laptop/5420_sp14_setupspecs/memory?guid=guid-f07064b8-2eb4-49ec-88a8-43b102e42417&lang=en-us', detail: 'Family-level manufacturer specifications are background information only. They do not certify the synthetic inventory SKUs or establish exact physical compatibility for an individual device.' },
    { id: 'lenovo-family-reference', title: 'Manufacturer reference · Lenovo Parts Lookup', kind: 'manufacturer', url: 'https://support.lenovo.com/us/en/parts-lookup', detail: 'Lenovo distinguishes exact device/part lookup from general model information. Real deployments need approved part identifiers and technician inspection; these demo approvals are synthetic.' },
  ],
  devices: [
    { id: 'device-01', label: 'Laptop 01 · multi-part rebuild', model: 'Dell Latitude 5420', needs: ['D5420-RAM-8', 'D5420-SSD-256'], repairMinutes: 70, priority: 3, eligible: true, intakeNote: 'Needs both memory and storage. First in the intake queue, but consumes the same scarce components that can restore two other laptops.', qaRequired: true },
    { id: 'device-02', label: 'Laptop 02 · memory replacement', model: 'Dell Latitude 5420', needs: ['D5420-RAM-8'], repairMinutes: 15, priority: 8, eligible: true, intakeNote: 'Diagnosed memory fault; all other components passed the demo intake check.', qaRequired: true },
    { id: 'device-03', label: 'Laptop 03 · storage replacement', model: 'Dell Latitude 5420', needs: ['D5420-SSD-256'], repairMinutes: 20, priority: 8, eligible: true, intakeNote: 'Storage replacement required. Data sanitization and boot tests remain release gates.', qaRequired: true },
    { id: 'device-04', label: 'Laptop 04 · memory replacement', model: 'Lenovo ThinkPad T480', needs: ['T480-RAM-8'], repairMinutes: 15, priority: 6, eligible: true, intakeNote: 'Exact approved memory SKU recorded during intake.', qaRequired: true },
    { id: 'device-05', label: 'Laptop 05 · storage replacement', model: 'Lenovo ThinkPad T480', needs: ['T480-SSD-256'], repairMinutes: 20, priority: 6, eligible: true, intakeNote: 'Matched storage assembly is available from an inspected donor. Final drive sanitization is still required.', qaRequired: true },
    { id: 'device-06', label: 'Laptop 06 · memory replacement', model: 'Lenovo ThinkPad T480', needs: ['T480-RAM-8'], repairMinutes: 15, priority: 5, eligible: true, intakeNote: 'Ready for a verified replacement module and technician sign-off.', qaRequired: true },
    { id: 'device-07', label: 'Laptop 07 · double-module kit', model: 'Lenovo ThinkPad T480', needs: ['T480-RAM-8', 'T480-RAM-8'], repairMinutes: 25, priority: 4, eligible: true, intakeNote: 'Requires two exact approved modules. A partial kit does not produce a recovered laptop.', qaRequired: true },
    { id: 'device-08', label: 'Laptop 08 · identity hold', model: 'Dell Latitude family · revision unknown', needs: ['D5420-RAM-8'], repairMinutes: 15, priority: 10, eligible: false, holdReason: 'Exact model revision and compatibility evidence are missing. A technician must resolve identity before planning.', intakeNote: 'Do not infer compatibility from the case appearance or a generic DDR specification.', qaRequired: true },
    { id: 'device-09', label: 'Laptop 09 · storage replacement', model: 'Lenovo ThinkPad T480', needs: ['T480-SSD-256'], repairMinutes: 20, priority: 7, eligible: true, intakeNote: 'Can use a confirmed donor assembly or a purchased matching assembly within the cash budget.', qaRequired: true },
    { id: 'device-10', label: 'Laptop 10 · memory replacement', model: 'Lenovo ThinkPad T480', needs: ['T480-RAM-8'], repairMinutes: 15, priority: 7, eligible: true, intakeNote: 'A quick repair, provided one verified module is reserved without double allocation.', qaRequired: true },
  ],
  parts: [
    { id: 'part-dell-ram', sku: 'D5420-RAM-8', label: 'Approved D5420 memory · stock', source: 'stock', quantity: 1, costCents: 0, harvestMinutes: 0, verified: true, evidenceId: 'demo-d5420-memory' },
    { id: 'part-dell-ssd-donor', sku: 'D5420-SSD-256', label: 'Approved D5420 storage · donor D-201', source: 'donor', donorId: 'donor-D-201', quantity: 1, costCents: 0, harvestMinutes: 10, verified: true, evidenceId: 'demo-d5420-storage' },
    { id: 'part-t480-ram-stock', sku: 'T480-RAM-8', label: 'Approved T480 memory · stock', source: 'stock', quantity: 2, costCents: 0, harvestMinutes: 0, verified: true, evidenceId: 'demo-t480-memory' },
    { id: 'part-t480-ram-donor', sku: 'T480-RAM-8', label: 'Approved T480 memory · donor D-202', source: 'donor', donorId: 'donor-D-202', quantity: 1, costCents: 0, harvestMinutes: 10, verified: true, evidenceId: 'demo-t480-memory' },
    { id: 'part-t480-ssd-donor', sku: 'T480-SSD-256', label: 'Approved T480 storage · donor D-203', source: 'donor', donorId: 'donor-D-203', quantity: 1, costCents: 0, harvestMinutes: 10, verified: true, evidenceId: 'demo-t480-storage' },
    { id: 'part-t480-ssd-buy', sku: 'T480-SSD-256', label: 'Approved T480 storage · purchase', source: 'purchase', quantity: 2, costCents: 2500, harvestMinutes: 0, verified: true, evidenceId: 'demo-t480-storage' },
    { id: 'part-unverified-ram', sku: 'T480-RAM-8', label: 'Loose memory module · unverified', source: 'stock', quantity: 4, costCents: 0, harvestMinutes: 0, verified: false, evidenceId: 'demo-unidentified' },
  ],
};

export const defaultRecoveryLimits: RecoveryLimits = { budgetCents: 2500, technicianMinutes: 180, unavailablePartIds: [] };
