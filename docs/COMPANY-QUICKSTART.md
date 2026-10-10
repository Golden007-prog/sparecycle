# Try SpareCycle with your workshop

The current application is a browser-local prototype. Use one coordinator and a small, non-sensitive pilot batch. Company profiles and saved batches are isolated in this browser; they are not authenticated shared company accounts.

Open [company setup](https://sparecycle-topaz.vercel.app/app?setup=1) to begin, or [explore the workshop](https://sparecycle-topaz.vercel.app/app) first. The public [team guide](https://sparecycle-topaz.vercel.app/for-teams) explains the pilot boundaries.

## Three steps

1. **Create your company workspace.** Enter a company or workshop name, site, workflow type, and default cash and technician-time limits. Start with the synthetic demo to learn the interface.
2. **Bring a small batch.** Download the Devices and Parts CSV templates from Import batch, replace the synthetic examples, and import both spreadsheets. JSON remains supported. Start with at most 18 devices and 40 part rows. Save the batch under a useful name.
3. **Review and hand off.** Inspect evidence and holds, compare the proposed repair plan against arrival-order allocation, and mark a part unavailable to test a failure. Request an optional AI explanation, then export draft work orders for technician review. Record actual repair and release evidence in your existing system.

## Preparing the spreadsheets

Save as comma-separated UTF-8 CSV. Keep the template headers. Put commas, double quotes, or line breaks inside properly quoted CSV fields; spreadsheet export normally handles this automatically.

### Devices

| Column | Meaning |
| --- | --- |
| `id` | Unique short device identifier, such as `L-001`. No personal details. |
| `label` | Coordinator-friendly device label. |
| `model` | Required recorded model name. If exact revision is unresolved, record that uncertainty and keep the device on hold. |
| `needs` | One to six diagnosed exact approved SKU requirements separated by `\|`. Repeat a SKU to request two units. |
| `repair_minutes` | Whole estimated technician minutes, from 1 to 600. |
| `priority` | Coordinator-assigned priority from 0 to 10. The allocator first maximizes complete device count. |
| `eligible` | `true` only when the device can enter this repair-planning batch and `hold_reason` is empty. Blank is treated as false. |
| `hold_reason` | Explain identity, condition, ownership, or other unresolved holds. |
| `intake_note` | Non-sensitive technician notes; not a place for customer files or credentials. |

### Parts

| Column | Meaning |
| --- | --- |
| `id` | Unique inventory-row identifier. |
| `sku` | Exact approved part SKU matching a device requirement. |
| `label` | Clear component description. |
| `source` | `stock`, `donor`, or `purchase`. |
| `donor_id` | Required only for donor parts. A donor cannot also be a repair candidate in this batch. |
| `quantity` | Whole available units from 0 to 100. |
| `cost_usd` | Incremental cost per unit from 0 to 10000, such as `12.50`. No currency symbol; at most two decimals. |
| `prep_minutes` | Per-unit inspection/harvest preparation estimate from 0 to 600. |
| `verified` | `true` only for coordinator-declared verified stock. Blank is false. |
| `evidence_detail` | Required for verified parts: record the basis for the exact match and condition declaration. |

The importer does not inspect hardware or authenticate a declaration. Importing `verified=true` preserves your supplied assertion; it does not independently establish compatibility. Unknown or unverified parts remain unavailable to the allocator.

Identifiers and SKUs must start with a letter or digit, use only letters, digits, dots, colons, underscores or hyphens, and contain at most 80 characters. Labels, model names and batch names allow 160 characters; hold reasons 500; intake notes 1,200; evidence details 1,600. Keep each CSV below 100 KB.

## Using the model catalog

Kaggle catalog rows are third-party reference records. Use them to compare recorded names and specifications. A catalog match does not identify a specific donated unit, prove a replacement part fits, establish current value, or certify condition. Keep the dataset version, license, and limitations visible when presenting it.

## Pilot success measures

Use **Restore backup** from the first-run banner or workspace library. A validated backup adds separate company copies labeled `(restored)`, with fresh workspace and saved-batch identifiers; existing companies remain intact. The whole restore is rejected if it would exceed eight companies. Approvals and physical checklists are not restored.

If saved data cannot be validated on startup, SpareCycle preserves the original text and pauses auto-save. Download it, then restore a valid backup or explicitly confirm replacement. Use one active editing tab: the prototype does not coordinate simultaneous edits across tabs.

Record the time taken to prepare a batch, the number of missing or corrected declarations, changes between the proposed and technician-approved plan, completed repairs, and parts that failed inspection. Compare alternatives using the same inventory, budget, and time assumptions. The synthetic seven-versus-five example is a demonstration, not a promised customer gain.

## Before a shared production rollout

A shared company deployment needs authenticated users, server-enforced tenant separation, persistent audit history, concurrent stock reservations, backup and recovery, shared API quotas, and a validated data-retention policy. Those controls are not supplied by local company profiles. Keep exports as backups during the prototype pilot, and retain your existing physical QA and release procedures.
