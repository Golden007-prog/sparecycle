# SpareCycle: validation evidence

Recorded 10 October 2026. This ledger separates observed prototype behavior from pending integration and submission work. All repair outcomes below use synthetic records. No physical repairs, customer results, or production-service guarantees are claimed.

## Release identity

| Field | Observation |
| --- | --- |
| Public application | https://sparecycle-topaz.vercel.app |
| Public repository | https://github.com/Golden007-prog/sparecycle |
| Repository content | Source published on main |
| Verified runtime source commit | 69c964f |
| Successful deployment checkpoint | Deployment identifier lrxb7vwng; stable alias https://sparecycle-topaz.vercel.app |
| Anonymous application access | HTML returned HTTP 200; manual planner loaded in the browser |
| Production health | Verified aiConfigured and tracingConfigured are true; reports nvidia/Nemotron-3_5-Lightning |

## Automated verification

| Check | Result | Interpretation |
| --- | --- | --- |
| Complete current test suite | 56 passed | 24 API, 11 domain, 3 export, 7 CSV-import, and 11 workspace tests |
| Production build | Passed locally and remotely | TypeScript check and Vite production build completed |
| Allocation oracle | Included in domain tests | Independent brute-force comparison across 24 varied small fixtures |
| Search-cap behavior | Included in domain tests | Feasible output retains an explicit incomplete-search status |
| API/privacy behavior | Offline tests passed | Includes intercepted LangSmith payload checks; this does not prove remote trace delivery |
| Export behavior | Three export tests passed | Automated output checks do not replace manual inspection in a spreadsheet application |

Reproduction commands are npm test and npm run build. The targeted domain command is npx tsx --test tests/recovery.test.ts. Record the final commit alongside repeated release checks when source publication is complete.

## Synthetic benchmark

Fixture: supplied demonstration batch, $25 incremental purchase budget, 180 technician minutes, all declared eligible stock available.

| Outcome | Intake-order baseline | Allocator |
| --- | --- | --- |
| Projected complete repair candidates | 5 | 7 |
| Incremental cash | $25 | $25 |
| Planned technician time | 160 minutes | 150 minutes |

Marking part-t480-ram-donor unavailable yields six projected candidates. The baseline and allocator share stock, eligibility, exact-SKU declarations, and resource constraints. This is a fixed algorithmic comparison, not a measurement of human performance or actual repair yield.

## Browser observations

Confirmed during implementation browser checks:

- The default plan shows seven projected repair candidates.
- Making the donor RAM unavailable recalculates the plan to six.
- Device inspection exposes the identity hold and unresolved reason.
- Invalid batch import is rejected.
- A valid synthetic one-device JSON batch imports and produces one candidate; restoring the demo returns seven.
- The publicly deployed manual planner loads anonymously.
- At 390-pixel mobile width, the document measures 375 pixels wide with no horizontal overflow.
- Closed mobile navigation is hidden from the accessibility tree. Opening navigation focuses Recovery planner; Escape closes it and restores focus to Open navigation; page selection focuses the main content.

Genuine desktop and mobile browser captures are stored in docs/assets/sparecycle-desktop.jpg and docs/assets/sparecycle-mobile.jpg. These captures document the interface. The successful live agent request is separately recorded below.

Still to record explicitly: manual CSV/JSON export inspection, reviewed-state invalidation, and the final deployed interaction replay. Recorded mobile navigation checks are not a comprehensive accessibility audit.

## Live model and trace verification

| Evidence field | Status |
| --- | --- |
| Exact NVIDIA model that completed a request | nvidia/Nemotron-3_5-Lightning |
| Deployed intake response | Successful real request; 9.35-second observed latency |
| Completed deployed batch review | Successful HTTP 200 response; 2.8-second API observation |
| Actual tools executed | list_inventory completed; compute_recovery_plan completed |
| Independent returned plan | Seven projected candidates, five-candidate baseline, $25 cost, 150 technician minutes; agrees with the synthetic benchmark |
| Observed request latency and usage | Intake 9.35 seconds; plan 2.8 seconds including trace flush; successful plan completion 356 tokens, zero reasoning tokens, stop finish reason |
| Delivered LangSmith trace inspected | Successful plan root and list_inventory/compute_recovery_plan children inspected in sparecycle; root server trace 2.49 seconds, tool children approximately 0.02 seconds |
| Inspected trace content | Successful plan root and tool children had empty inputs and outputs; intake root was also inspected |
| Public error behavior | Earlier integration failures were explicit and were not counted as successful requests; the final recorded plan request completed successfully |

The final successful baseline request used the corrected module paths, bounded tool loop, and constrained-response reasoning settings. The expanded suite has 56 passing tests and a passing local production build. Timings and token counts are individual request observations, not a performance, reliability, or cost benchmark.

The first successful generated explanation described six reused units as donors, although the deterministic reusedParts field includes both existing stock and donor components. The source prompt now explicitly defines that aggregate. Use the deterministic allocations for source attribution; generated explanations still require review. A follow-up wording check after the prompt redeployment is not recorded here.

Configuration flags, a correlation ID, and offline mocks are not substitutes for these observations. Do not include credentials, private inventory, or account secrets in this ledger.

## Company prototype verification — 10 October 2026

The expanded local interface was checked in Brave through normal browser controls:

- Three-step setup created a named company, its planning defaults, and the synthetic first batch.
- Saving a copy and setting its budget to zero produced six proposals. Reload preserved the copied batch and its zero budget; the original retained its $25 budget.
- The two supplied CSV templates imported as a new saved batch with two devices: one proposed and one on hold.
- A second company imported the same template. The first company's review mark and physical checklist did not carry over.
- Invalid pasted backup JSON was rejected. A valid synthetic backup previewed one company/one batch, restored with a `(restored)` name, and left both existing companies in the switcher.
- Catalog search found two ThinkPad listing variants; a nonexistent search displayed an empty result. The source, CC0 declaration and reference-only warning were visible.
- Roadmap filters returned 216 candidates, four shipped candidate stories in the batch-optimization module, and one exact SC-0520 search result.
- At a 390-pixel viewport override with the browser's current zoom, the measured CSS viewport was 355 pixels and content width 341 pixels. The page and CSV dialog had no horizontal overflow after a narrow-grid fix. Mobile navigation focused its first item on opening and restored focus to the toggle on Escape.

The file-chooser upload path could not be automated because the browser extension lacked file-URL permission. Pasted CSV and pasted backup flows were verified instead; file reading is not claimed as an observed browser result. Invalid-storage preservation and restore capacity/identity validation have automated regression coverage.

Kaggle import reproduction matched 920 source rows, 613 excluded rows, 16 duplicate accepted rows, and 291 published variants. The catalog validator verified 520 distinct story IDs, titles and user stories, 26 modules of 20 stories, 216 differentiation flags, 29 shipped-story flags and 491 planned flags. It also checks that the public roadmap payload matches the CSV.

A fresh request on the prior public deployment completed in 2.2 seconds, reporting `nvidia/Nemotron-3_5-Lightning through Nebius Token Factory`, with `list_inventory` and `compute_recovery_plan` completed. Trace correlation: `bc20c59a-eca6-4359-8bcf-43bd1155d57c`. Its browser result confirms the provider path; separate trace delivery for this particular repeat request was not re-inspected.

Company profiles remain local browser records, not authenticated tenants. Use one active editing tab. The generated bundle is approximately 533 KB before gzip (136 KB gzip); Vite's size warning is recorded, not suppressed. A broad accessibility, load, security, and customer acceptance audit remains future work.

## Deployment integration limitation

Vercel Git connection returned HTTP 400 because the account requires a GitHub Login Connection. Manual production deployment works, and the public source repository is independently available. Automatic deployment on push is not configured. No account connection change is required to use the current live release.

## Submission status

The public YouTube video has not been created. Devpost submission has not been recorded. Source publication and a complete live batch-agent request are verified; video creation and final entrant submission review remain necessary before declaring the hackathon entry complete. See RELEASE.md and DEVPOST.md for the remaining checklist and submission copy.
