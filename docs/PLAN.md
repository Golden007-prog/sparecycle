# SpareCycle: delivery plan

Build a browser-local company and batch planning prototype for the Nebius x NVIDIA **Best Apps and Agents** track.

The workflow is: three-step company setup → CSV/JSON batch import and declared evidence → coordinator review → batch constraints → feasible allocations → baseline comparison → donor-failure replay → work orders, report and workspace backup.

## Scope

The user is a refurbishment coordinator. Inputs are diagnosed laptop needs, tested spare or approved donor components, exact-SKU compatibility with provenance, availability, estimated labor and part costs, and release requirements.

The app supports up to eight local company profiles and 20 saved batches per profile. Three-step setup records company details, default limits and a first-batch choice. Validated imports accept two CSV files (Devices and Parts) or a JSON batch; a synthetic demonstration remains available. Named batches autosave in this browser, and switching records invalidates review state. Company defaults apply to new batches without rewriting existing limits.

Work orders export as CSV, and evidence packets export as JSON. Complete workspace backups have a separate validated restore flow: restore as new company profiles with fresh profile and saved-batch identifiers, preserving existing records and enforcing workspace limits. Report formats, batch imports and workspace backups are distinct. Invalid stored state must remain available for recovery rather than being silently overwritten. Shared multi-user persistence and Supabase are outside this browser-local scope.

The model catalog contains 291 historical laptop listing variants across 14 brands from a Kaggle dataset whose uploader declares CC0-1.0. Retain source metadata and limitations, label prices as historical INR listings, and keep catalog data out of compatibility and diagnosis approval. The cleaning rules and reproducible hash are in [DATA-SOURCES.md](DATA-SOURCES.md).

The planner jointly searches device subsets and part assignments, lexicographically maximizing complete repair candidates and their summed priority, then minimizing incremental cash and technician time. It supports up to 18 devices, 40 part rows, and six needed units per device, with a 200,000-state search cap and an explicit incomplete-search status. Dedicated donor records are sources only, never repair candidates. Technician time includes device repair and per-unit harvesting/preparation. The intake-order baseline greedily prefers lower cash and then preparation time under the same rules.

The planner selects complete repair candidates within stock, time, and budget limits. It preserves stock, blocks unknown compatibility, respects donor restrictions, and records rejection reasons. Display the objective, actual baseline policy, and search status. Do not claim exhaustive optimality when search is capped.

## Implementation work streams

1. **Domain and allocator:** typed inventory, diagnostics, part relationships, constraints, deterministic allocation, baseline, independent invariant checks, and failure scenarios.
2. **Workshop interface:** three-step company setup, profile and saved-batch library, autosave and restore, CSV/JSON import, reference catalog, schematic batch overview, exact allocation inspection, reviewable work orders, and replay.
3. **Agent:** Nemotron intake and explanations through Nebius, with bounded list_inventory, inspect_device, and compute_recovery_plan tools.
4. **Privacy and operations:** server-only keys, bounded requests, explicit errors, optional metadata-only LangSmith traces, and honest quota limits.
5. **Research and product:** primary-source comparison, six-dimension assessment, Kaggle source and quality review, coordinator pilot, and untested business hypotheses. The feature catalog contains 520 workflow stories, 216 MVP candidates, 29 currently marked shipped and 491 planned. Story counts are not UI-button counts; company features awaiting acceptance remain planned.
6. **Verification:** meaningful domain/API/CSV/workspace tests, production build, desktop/mobile/keyboard review, import/export/restore checks, catalog reproduction, and actual provider calls.
7. **Release:** public MIT source, working Vercel URL, reproducible setup, release evidence, and final public YouTube demonstration.

## Technical architecture

React, Vite, and TypeScript provide the frontend. Vercel serves serverless API routes. Node.js 22 loads .env.local for local development.

GET /api/health exposes configuration presence without secrets. POST /api/analyze supports structured intake, bounded tool-based planning and grounded explanations of supplied workshop context. The exact schema must match the shipped server and UI. `/roadmap.html` presents the product story catalog separately from operational planning.

The model structures supplied information and invokes allowlisted tools. It cannot establish new compatibility, diagnose hardware, approve a repair, mutate external systems, or certify a release. Deterministic code calculates authoritative allocation results.

## Acceptance criteria

- Imported references, quantities, costs, and limits are validated before planning.
- CSV parsing preserves quoted fields, rejects malformed records, and never promotes missing eligibility or verification into approval.
- Profiles and saved batches stay isolated within the browser; switching them clears review approvals and checklists.
- Backups restore as new profiles without overwriting existing records; malformed or oversized data fails before mutation.
- Invalid persisted data remains recoverable and is not silently replaced by a default store.
- Reference catalog rows retain source and license information and cannot approve exact part compatibility.
- Unknown compatibility is ineligible; synthetic evidence is clearly labeled.
- No component is allocated twice, no stock becomes negative, and each selected device has a complete eligible assignment.
- Approved donor rules and failed/unavailable components constrain both baseline and optimized plans.
- Stock quantities, time, and budget limits are enforced at boundaries.
- Small-case optimizer results agree with exhaustive checks; capped searches expose their status.
- Changing a donor's availability recalculates dependent assignments.
- Intake is reviewable and provider failures stay visible.
- Exports include allocations, assumptions, unresolved checks, and the synthetic-data label when applicable.
- QA, wipe evidence, and support-policy checks remain distinct from a modeled repair.
- Keyboard use, narrow screens, visible focus, and reduced motion are reviewed.

These are requirements, not blanket completed-check claims. The earlier baseline passed its test suite and production build. Expanded company, CSV, catalog, storage-recovery and restore checks are being integrated; final results and browser/deployment observations belong in [VALIDATION.md](VALIDATION.md).

## Recorded release evidence and remaining submission work

| Evidence | Status |
| --- | --- |
| Public repository | [Earlier baseline published on main](https://github.com/Golden007-prog/sparecycle); expanded company release awaiting final publication |
| Live Vercel URL and anonymous access | [Live manual planner](https://sparecycle-topaz.vercel.app); earlier baseline anonymous HTML HTTP 200 and browser load verified; expanded release requires fresh checks |
| Actual NVIDIA model ID and successful calls | nvidia/Nemotron-3_5-Lightning; intake succeeded in 9.35 seconds; complete batch review succeeded in 2.8 seconds |
| Executed tool names and metadata-only trace inspection | list_inventory and compute_recovery_plan completed; successful plan root and children inspected with empty inputs/outputs |
| Domain allocation suite | Passed on 10 October 2026; includes 24 oracle fixtures |
| Full test/build result | Earlier baseline passed; record the final expanded-release result in VALIDATION.md |
| Browser observations | Earlier baseline: default 7 → donor-failure 6; identity hold; invalid JSON import rejection; valid one-device import/restoration; 390-pixel mobile and navigation focus checks |
| Kaggle catalog | Official CC0 dataset downloaded and profiled; 291 variants retained; reproducible importer check passed |
| Expanded company/CSV/restore/catalog interface | Final integration, browser and deployed verification pending |
| Synthetic fixture | $25/180 minutes: baseline 5, allocator 7; unavailable donor RAM: 6 |
| Public YouTube video, at most three minutes | Remaining submission task |
| Devpost submission | Entrant action after final review |

## Explicit exclusions

No automated hardware diagnosis, open-ended compatibility inference, device access, disk erasure, purchases, external messaging, environmental certification, or production team inventory system. No customers, measured repair gains, commercial traction, or unique-market claims without evidence.

The design contract is [DESIGN.md](DESIGN.md). The [company quickstart](COMPANY-QUICKSTART.md), [adoption guide](COMPANY-ADOPTION.md), [data-source report](DATA-SOURCES.md), and [feature catalog](FEATURES.md) document the expanded scope. Product and research assumptions remain separate from verified release results.
