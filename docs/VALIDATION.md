# SpareCycle: validation evidence

Recorded 10 October 2026. This ledger separates observed prototype behavior from pending integration and submission work. All repair outcomes below use synthetic records. No physical repairs, customer results, or production-service guarantees are claimed.

## Release identity

| Field | Observation |
| --- | --- |
| Public application | https://sparecycle-topaz.vercel.app |
| Public repository | https://github.com/Golden007-prog/sparecycle |
| Repository content | Repository created; source push pending at this checkpoint |
| Final source commit | Pending source push |
| Latest deployment at this checkpoint | https://sparecycle-2pdf4u9m4-basuoikantik-7538s-projects.vercel.app; stable alias unchanged |
| Anonymous application access | HTML returned HTTP 200; manual planner loaded in the browser |
| Production health | Verified aiConfigured and tracingConfigured are true; reports nvidia/Nemotron-3_5-Lightning |

## Automated verification

| Check | Result | Interpretation |
| --- | --- | --- |
| Complete current test suite | 37 passed | 23 API, 11 domain, and 3 export tests |
| Production build | Passed | TypeScript check and Vite production build completed |
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

Repeat the complete interaction set against the final production deployment after remaining updates. Genuine desktop and mobile browser captures are stored in docs/assets/sparecycle-desktop.jpg and docs/assets/sparecycle-mobile.jpg. These captures document the interface; they do not prove a completed live AI run.

Still to record explicitly: manual CSV/JSON export inspection, reviewed-state invalidation, and the final deployed interaction replay. Recorded mobile navigation checks are not a comprehensive accessibility audit.

## Live model and trace verification

| Evidence field | Status |
| --- | --- |
| Exact NVIDIA model that completed a request | nvidia/Nemotron-3_5-Lightning |
| Deployed intake response | Successful real request; 9.35-second observed latency |
| Completed deployed batch review | Pending after a tool-loop fix and redeployment |
| Actual tools executed | Earlier incomplete agent attempt executed list_inventory and compute_recovery_plan; completion is not claimed |
| Independent returned plan compared with browser result | Pending completed live review |
| Observed request latency and usage | Intake latency 9.35 seconds; usage/cost measurement still pending |
| Delivered LangSmith trace inspected | Personal sparecycle project created; intake root and planner-tool records inspected |
| Inspected trace content | Intake root and compute_recovery_plan child had empty inputs and outputs; full successful agent-run inspection remains pending |
| Public error behavior | Initial module-path failure and incomplete agent request were visible; neither was counted as successful inference or a complete review |

The module-path issue was corrected before the successful intake. A redundant tool round was also corrected. The latest incomplete agent request executed list_inventory and compute_recovery_plan, then exhausted its 1,500-token completion budget on reasoning and returned a length finish reason. A constrained-response configuration adjustment is being tested. The currently recorded suite has 37 passing tests and a passing production build; successful full-agent completion remains pending rather than being reported as a release blocker or a completed result.

Configuration flags, a correlation ID, and offline mocks are not substitutes for these observations. Do not include credentials, private inventory, or account secrets in this ledger.

## Submission status

The public YouTube video has not been created. Devpost submission has not been recorded. The repository source push, completed live batch-agent evidence, video, and final entrant review remain necessary before declaring the hackathon entry complete. See RELEASE.md and DEVPOST.md for the remaining checklist and submission copy.
