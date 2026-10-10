# SpareCycle: delivery plan

Build a complete single-workshop planning prototype for the Nebius x NVIDIA **Best Apps and Agents** track.

The workflow is: inventory and declared evidence → coordinator review → batch constraints → feasible allocations → baseline comparison → donor-failure replay → work orders and report.

## Scope

The user is a refurbishment coordinator. Inputs are diagnosed laptop needs, tested spare or approved donor components, exact-SKU compatibility with provenance, availability, estimated labor and part costs, and release requirements.

The app supports validated JSON batch import and a synthetic demonstration batch. Work orders export as CSV, and evidence packets export as JSON; CSV import is not implemented. Report formats are distinct from the batch import schema. Browser-local state is sufficient for this prototype. Shared multi-user persistence and Supabase are not required.

The planner jointly searches device subsets and part assignments, lexicographically maximizing complete repair candidates and their summed priority, then minimizing incremental cash and technician time. It supports up to 18 devices, 40 part rows, and six needed units per device, with a 200,000-state search cap and an explicit incomplete-search status. Dedicated donor records are sources only, never repair candidates. Technician time includes device repair and per-unit harvesting/preparation. The intake-order baseline greedily prefers lower cash and then preparation time under the same rules.

The planner selects complete repair candidates within stock, time, and budget limits. It preserves stock, blocks unknown compatibility, respects donor restrictions, and records rejection reasons. Display the objective, actual baseline policy, and search status. Do not claim exhaustive optimality when search is capped.

## Implementation work streams

1. **Domain and allocator:** typed inventory, diagnostics, part relationships, constraints, deterministic allocation, baseline, independent invariant checks, and failure scenarios.
2. **Workshop interface:** sidebar navigation, schematic batch overview, constraints, device inspection with exact allocations and evidence, JSON inventory import, reviewable work orders, and replay.
3. **Agent:** Nemotron intake and explanations through Nebius, with bounded list_inventory, inspect_device, and compute_recovery_plan tools.
4. **Privacy and operations:** server-only keys, bounded requests, explicit errors, optional metadata-only LangSmith traces, and honest quota limits.
5. **Research and product:** primary-source comparison, six-dimension assessment, validation plan, and untested business hypotheses.
6. **Verification:** meaningful domain/API tests, production build, desktop/mobile/keyboard review, import/export checks, and actual provider calls.
7. **Release:** public MIT source, working Vercel URL, reproducible setup, release evidence, and final public YouTube demonstration.

## Technical architecture

React, Vite, and TypeScript provide the frontend. Vercel serves serverless API routes. Node.js 22 loads .env.local for local development.

GET /api/health exposes configuration presence without secrets. POST /api/analyze supports structured intake and explanations of supplied workshop context. The exact schema must match the shipped server and UI.

The model structures supplied information and invokes allowlisted tools. It cannot establish new compatibility, diagnose hardware, approve a repair, mutate external systems, or certify a release. Deterministic code calculates authoritative allocation results.

## Acceptance criteria

- Imported references, quantities, costs, and limits are validated before planning.
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

These are requirements, not blanket completed-check claims. The current suite has 38 passing tests and a passing production build. Completed browser observations and pending coverage are recorded in [VALIDATION.md](VALIDATION.md).

## Recorded release evidence and remaining submission work

| Evidence | Status |
| --- | --- |
| Public repository | [Source published on main](https://github.com/Golden007-prog/sparecycle); runtime commit 69c964f |
| Live Vercel URL and anonymous access | [Live manual planner](https://sparecycle-topaz.vercel.app); anonymous HTML HTTP 200 and browser load verified |
| Actual NVIDIA model ID and successful calls | nvidia/Nemotron-3_5-Lightning; intake succeeded in 9.35 seconds; complete batch review succeeded in 2.8 seconds |
| Executed tool names and metadata-only trace inspection | list_inventory and compute_recovery_plan completed; successful plan root and children inspected with empty inputs/outputs |
| Domain allocation suite | 11 tests passed on 10 October 2026; includes 24 oracle fixtures |
| Full test/build result | 38 tests passed: 24 API, 11 domain, 3 export; production build passed |
| Browser observations | Default 7 → donor-failure 6; identity hold; invalid import rejection; valid one-device import/restoration; 390-pixel mobile and navigation focus checks |
| Synthetic fixture | $25/180 minutes: baseline 5, allocator 7; unavailable donor RAM: 6 |
| Public YouTube video, at most three minutes | Remaining submission task |
| Devpost submission | Entrant action after final review |

## Explicit exclusions

No automated hardware diagnosis, open-ended compatibility inference, device access, disk erasure, purchases, external messaging, environmental certification, or production team inventory system. No customers, measured repair gains, commercial traction, or unique-market claims without evidence.

The design contract is [DESIGN.md](DESIGN.md). Product and research assumptions are documented separately from verified release results.
