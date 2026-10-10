# SpareCycle: workshop bench design

## Audience and visual purpose

Design for a refurbishment coordinator who understands stock and work queues but should not need to understand optimization algorithms or model infrastructure.

The principal question is “What can this batch become with the parts and time we have?” The interface answers with a schematic overview of component sources and complete repair candidates. The bench is the main visual; avoid a wall of equal metric cards. Exact allocations appear in device inspection.

## Palette and type

| Role | Value |
| --- | --- |
| Porcelain canvas | #f4f6f8 |
| Main surface | #ffffff |
| Slate text | #25314e |
| Cobalt action and selected state | #4c61df |
| Pale lavender supporting surface | #e9edff |
| Amber exception text/accent | #9e601e |

The implementation uses DM Sans for headings and body text, with Segoe UI and sans-serif fallbacks. Use sentence case, short labels, readable line lengths, and strong hierarchy. Color supports labels and icons; it must never be the only indicator of availability, failure, or selection.

Primary actions are cobalt. Amber means attention or unresolved evidence, not automatic danger. Keep ordinary surfaces quiet so the active allocation is legible. Verify contrast on the actual combinations rather than assuming the palette guarantees it.

## Layout

A stable sidebar provides Recovery planner, Batch inventory, Evidence library, Work orders, Scenario lab, and Model catalog navigation. A company/workspace control identifies the active local profile and opens the saved-batch library. The header identifies the active batch and its synthetic or imported status.

The workshop hero is a schematic batch overview. The source side shows stock and authorized donor components; the destination side shows complete repair candidates and blocked devices. Its central spine represents the planning stage, not every literal allocation. Open a device to inspect exact source rows, quantities, and evidence.

Keep constraints next to a distinct planning panel on the right. The panel presents the main result, its baseline comparison, budget/time use, and search status. Supporting counts belong near the relevant flow, rather than in a uniform grid.

A device-inspection dialog explains exact identifiers, diagnosed needs, assigned components, compatibility provenance, and rejection reasons. Inventory tables and the evidence library provide the detailed records without requiring the user to interpret the schematic.

## Interaction contract

1. Complete three-step setup: company/site details, default limits, and a choice of sample or import. A profile is local organization, not an authenticated account.
2. Start from the sample or import Devices and Parts CSV files or a JSON batch. Keep separate named batches in the company library.
3. Review evidence and unresolved records, set limits, and generate a plan.
4. Select a device to inspect its exact allocation and evidence.
5. Review work orders, export, and replay a failed donor component.
6. Export a workspace backup before removing local records. Restore through the separate workspace flow as new profiles, preserving existing companies and batches.

Expose the current plan's inputs and invalidate or recompute it when those inputs change. Do not leave stale output looking current.

Batch import has two CSV panels (Devices and Parts), downloadable templates, file selection and paste previews, plus a JSON alternative. The explicit Validate and import action reports rejected fields before saving a batch. Blank eligibility and verification stay false; CSV declarations are not independent hardware verification. AI intake produces an exportable review draft that still needs editing into the batch schema; it is not directly added to inventory. Work orders export as CSV and evidence packets as JSON, with clear labels distinguishing reports from import templates and workspace backups.

Support up to eight company profiles and 20 saved batches per profile. Changes to a selected saved batch autosave locally; an unsaved sample preview must not overwrite another batch. Changing company or batch clears review approvals and checklists. Explain browser-only persistence during setup and show storage failures with an export action. If persisted data is invalid, preserve the original for recovery rather than silently replacing it.

Workspace restore validates the complete backup and adds copies with new company and saved-batch identities. State the number of profiles being added and any capacity error before mutation. Preserve existing profiles; a backup is not an instruction to overwrite them. Removing a batch or company requires a clear scope explanation and an export opportunity.

The model catalog supports search and manufacturer filtering over 291 historical variants. Each card retains its source-row identity and reference specifications. Keep Kaggle source, CC0 declaration, age and limitations visible; historical INR prices are distinct from USD repair-budget inputs. No catalog selection should imply a diagnosis or approve component fit. See [DATA-SOURCES.md](DATA-SOURCES.md).

The work-orders view separates planned work from release checks. Replay shows the previous and current constraints and changed allocations; do not suggest that hypothetical failures happened in reality.

## Language and trust

Prefer “Planned repairs,” “Parts available,” “Needs review,” “Why this part,” and “Ready for technician review.”

Avoid labels that imply completed physical work, such as “Laptops saved,” before actual QA/release evidence exists. Explain a capped search in ordinary language and make details available without filling the primary workflow with implementation terms.

Keep “Synthetic workshop” visible on the sample. Imported records retain provenance but are not independently authenticated. “Verified in sample” means a fictional declaration, never certification.

Show provider errors plainly and preserve the manual workflow. Do not animate a fake tool sequence or substitute sample output for a failed live response.

The separate `/roadmap.html` page presents 520 product workflow stories and 216 MVP candidates. Its current status split is 29 stories marked shipped and 491 planned. These are catalog classifications, not implemented-button counts. Pending company capabilities retain planned status until accepted. Keep the roadmap visibly separate from the operational app and link the [feature catalog](FEATURES.md), [quickstart](COMPANY-QUICKSTART.md), and [adoption guide](COMPANY-ADOPTION.md).

## Responsive access and motion

On narrow screens, stack the diagram, constraints, and plan; use a readable allocation list in place of a cramped graph. All controls need accessible names, keyboard operation, visible focus, and comfortably sized targets. Drawers must manage focus and close predictably.

Respect reduced-motion preferences. Short transitions may help users follow an allocation change, but the result must also be clear through text and static highlighting. Any future Lottie asset should be added only when it improves a specific state, with its connection and scene verified; animation is not required for the core bench.

## Review before release

Inspect the rendered interface on desktop and mobile, run the complete keyboard workflow, verify focus and contrast, and confirm that evidence and export content remain readable. Check company setup and switching, named-batch autosave, CSV and JSON imports, backup restore without overwrite, invalid-storage recovery, catalog filtering, empty stock, unknown compatibility, insufficient budget, provider failure, no feasible plan, tied comparisons, and changed donor availability. Earlier baseline captures do not verify these expanded flows; record final deployed observations separately.
