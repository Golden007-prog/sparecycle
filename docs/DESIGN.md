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

A stable sidebar provides Workshop, Inventory, Work orders, and Replay navigation. The header identifies the active batch and its synthetic or imported status.

The workshop hero is a schematic batch overview. The source side shows stock and authorized donor components; the destination side shows complete repair candidates and blocked devices. Its central spine represents the planning stage, not every literal allocation. Open a device to inspect exact source rows, quantities, and evidence.

Keep constraints next to a distinct planning panel on the right. The panel presents the main result, its baseline comparison, budget/time use, and search status. Supporting counts belong near the relevant flow, rather than in a uniform grid.

A device-inspection dialog explains exact identifiers, diagnosed needs, assigned components, compatibility provenance, and rejection reasons. Inventory tables and the evidence library provide the detailed records without requiring the user to interpret the schematic.

## Interaction contract

1. Start from the sample or import records.
2. Review evidence and unresolved records.
3. Set limits and generate a plan.
4. Select a device to inspect its exact allocation and evidence.
5. Review work orders and export.
6. Replay a failed donor component and inspect changes.

Expose the current plan's inputs and invalidate or recompute it when those inputs change. Do not leave stale output looking current.

Batch import accepts JSON through a text preview and an explicit Validate and import action. Validation errors explain rejected fields. AI intake currently produces a reviewable extraction that can be exported as JSON; users must review and edit it before constructing an importable batch. It is not directly added to inventory. Work orders export as CSV, and evidence packets export as JSON; CSV import is not supported.

The work-orders view separates planned work from release checks. Replay shows the previous and current constraints and changed allocations; do not suggest that hypothetical failures happened in reality.

## Language and trust

Prefer “Planned repairs,” “Parts available,” “Needs review,” “Why this part,” and “Ready for technician review.”

Avoid labels that imply completed physical work, such as “Laptops saved,” before actual QA/release evidence exists. Explain a capped search in ordinary language and make details available without filling the primary workflow with implementation terms.

Keep “Synthetic workshop” visible on the sample. Imported records retain provenance but are not independently authenticated. “Verified in sample” means a fictional declaration, never certification.

Show provider errors plainly and preserve the manual workflow. Do not animate a fake tool sequence or substitute sample output for a failed live response.

## Responsive access and motion

On narrow screens, stack the diagram, constraints, and plan; use a readable allocation list in place of a cramped graph. All controls need accessible names, keyboard operation, visible focus, and comfortably sized targets. Drawers must manage focus and close predictably.

Respect reduced-motion preferences. Short transitions may help users follow an allocation change, but the result must also be clear through text and static highlighting. Any future Lottie asset should be added only when it improves a specific state, with its connection and scene verified; animation is not required for the core bench.

## Review before release

Inspect the rendered interface on desktop and mobile, run the complete keyboard workflow, verify focus and contrast, and confirm that evidence and export content remain readable. Check empty stock, unknown compatibility, insufficient budget, provider failure, no feasible plan, tied comparisons, and changed donor availability.
