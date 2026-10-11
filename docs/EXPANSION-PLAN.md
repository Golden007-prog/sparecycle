# SpareCycle expansion plan

Prepared 11 October 2026 from the current source and existing capability catalogs. This is a delivery plan, not a release announcement. The 200 selected capabilities below are **additional to the bounded workflows currently demonstrated**, drawn from the existing backlog rather than advertised as 200 newly invented or shipped features. Each keeps its stable story ID and acceptance criterion. A broad story that overlaps an existing foundation still requires its full acceptance evidence before its status changes.

## Current implementation truth

- `docs/feature-catalog.csv` contains 520 stories: 29 marked shipped and 491 planned across 26 modules. Its 216 differentiation flags are research hypotheses, not exclusivity or validation claims. The shipped labels describe individual Workshop behaviors, not 29 enterprise products.
- `docs/review-enterprise-backlog.csv` separately maps the supplied 200-item request: 8 implemented foundations, 20 narrow pilot mappings, 129 later items, 43 requiring domain validation. These overlap existing capabilities and must not be added to the 520-story count.
- Browser-local Workshop supports validated bounded JSON and fixed-template CSV import, local company profiles and saved batches, restoration/export, declared exact-SKU planning, constraints, donor separation, scenario replay, work-order exports, and Nebius note extraction/planner explanation. Company profiles are not user accounts. There is no shared stock ledger or protected physical release workflow.
- Authenticated Review has organization membership and five roles, passports, revisioned evidence, selected GitHub repository binding, bounded AI investigation/patch/review, unchanged-test verification, independent approval, durable reservations/jobs, and draft PR creation. This is a separate data model and authorization boundary from Workshop.
- The demonstrated Review profile supports one pure JavaScript diagnostics module and one to four unchanged test files. Public and explicitly provisioned private repository flows have recorded execution evidence. It does not support arbitrary builds, automatic merges, laptop administration, actual hardware repair or physical sanitization.
- Google sign-in has a recorded live return test. Customer SMTP was deferred by the user. Optional custom OIDC UI/configuration is not enforced company SSO, SCIM or automatic employee deprovisioning. A locally tested database migration still needs its own cloud-application evidence.
- Tavily research and the first Pilot Operations slice have now been implemented and checked locally. The replacement demonstration labels its genuine research capture as local runtime; deployed runtime proof belongs in the release ledger. Search results remain external references, never physical compatibility approval. The 200 selected roadmap stories below remain planned until each full acceptance gate is met.

## Complete workflow to build first

Build a **Pilot Operations Desk** for a coordinator testing the product with a small refurbishment batch. It closes the useful gap between a proposed allocation and recorded pilot outcomes, while clearly preserving browser-local storage and technician responsibility.

The workflow is: freeze a reviewed plan → record bench progress and exceptions → record actual effort and costs → collect manual QA evidence → export a handoff packet → compare recorded outcomes with the original proposal. Never interpret a checked box as independent certification or a local record as an authenticated approval.

Implement the following small, coherent slice before expanding into the 200-item plan:

| Deliverable | Acceptance gate | Scope boundary |
| --- | --- | --- |
| Versioned pilot-run snapshot | Creating a run copies the exact validated batch, limits, assignments and source timestamp; later edits do not change that run | Local planning snapshot, not a server transaction |
| Source-change warning | The desk detects a changed source fingerprint and offers a new run instead of silently rewriting an existing result | Does not revoke authenticated Review approvals |
| Per-device bench board | Each planned device has an explicit queued/in-progress/blocked/completed state; invalid transitions reject with a reason | Completion means technician-reported work, not certified release |
| Blocker and exception register | A blocked record requires a reason; resolving preserves its original reason and resolution note | No automatic fault diagnosis |
| Actual effort ledger | Nonnegative bounded minutes and incremental costs aggregate exactly and stay distinct from planned values | Not payroll, invoicing or accounting software |
| Evidence-linked bench notes | Notes reference a known run/device and existing evidence ID, with an explicit recorded timestamp | No implied machine-generated telemetry |
| Manual QA checklist | Required checks expose unchecked/failed/passed-with-evidence states; failed or missing checks remain visible in exports | Records declarations; does not enforce shared release authorization |
| Rework linkage | A follow-up records the source run/device and reason without overwriting the earlier outcome | No automatic inventory consumption or reservation |
| Readiness summary | The summary explains every unresolved blocker and missing evidence item rather than returning a fabricated pass | "Evidence complete" is not "hardware certified" |
| Proposed-versus-recorded scorecard | Proposed, attempted, technician-reported completed and handed-off counts remain separate; missing outcomes stay unknown | No causal ROI, carbon or customer-impact claim |
| Local handoff packet | JSON and print-friendly report contain frozen inputs, allocations, evidence references, exceptions and limitations | User chooses any external recipient; app sends nothing |
| Backup and restoration | A versioned export restores as a new local run, preserves originals, rejects duplicate/unsafe references and oversize content | No cloud backup or disaster-recovery claim |

These are 12 proposed deliverables forming one operations workflow. They are not 200 shipped features. Related backlog rows remain planned unless their full, often stronger shared-service acceptance criterion passes.

### Disjoint implementation ownership

- Operations domain worker: new `lib/pilot.ts` and `tests/pilot.test.ts`. Own bounded schemas, pure state transitions, derived scorecards, snapshot and restoration rules. Do not modify recovery math or Review authorization.
- Operations UI worker: new `src/PilotDesk.tsx`, `src/pilot.css`. Accept a validated batch/limits/plan and workspace selection key through props. Use a separate versioned local-storage key and avoid adding private content to traces.
- Existing Workshop UI owner: add the one integration point or `/app?view=operations` navigation hook in `src/App.tsx` after the component contract is agreed. The Tavily UI owner is already editing that file; avoid concurrent edits.
- Root/docs owner: write the pilot guide and update the release/capability ledger only after observed tests. Existing Tavily workers retain their API, provider and UI files. No new Supabase migration or Review action is required for the local pilot slice.

Suggested component contract: `PilotDesk({ batch, limits, plan, workspaceKey })`. Store immutable validated snapshots, bounded manual records and versioned exports; derive summaries from records instead of persisting conflicting counters. Limit storage size and report quota errors. Never use the local workspace key as an authentication credential.

Suggested pure domain contract, to finalize in `lib/pilot.ts` before the UI consumes it:

- `createPilotRun({ id, workspaceKey, batch, limits, plan, now })`: validate the inputs and plan correspondence, copy an immutable snapshot, create one device record per assignment, and store the source fingerprint. No run may claim an allocation for a device absent from the validated snapshot.
- `transitionPilotDevice(run, deviceId, status, note, now)`: enforce queued/in-progress/blocked/completed progression, require a blocker reason and a rework reason when reopening completed work, and return a new record without erasing history.
- `recordPilotWork(run, deviceId, { minutes, costCents, note }, now)`: append bounded nonnegative actual effort and incremental spend. Derive totals from entries; never modify the planner's original estimates.
- `recordPilotCheck(run, deviceId, { kind, status, evidenceNote }, now)`: record function, sanitization or accessory declarations. A passed check requires a meaningful evidence note. Missing or failed checks prevent an evidence-complete result.
- `addPilotNote(run, deviceId, note, now)`: append a bounded attributable-to-this-local-run note. It does not imply authenticated authorship.
- `setPilotAssignment(run, deviceId, { technician, dueDate })`: optional local workload labels with a bounded name and valid date; these fields never grant account privileges or guarantee completion.
- `pilotReadiness(run, deviceId)` and `pilotScorecard(run)`: derive explicit blockers and proposed/started/blocked/completed/evidence-complete counts, plus exact actual totals. A manual check is not an independent physical release authorization.
- `parsePilotStore(raw)` and `restorePilotRuns(existing, raw, newId)`: strictly validate a versioned bounded store, reject unsafe references and duplicate identifiers, restore copies without overwriting originals, and preserve corrupt raw records until the user decides how to recover.

The implementation owner may refine names and shapes before integration. The compiled domain exports are authoritative once the implementation is tested; this proposal is not an undocumented alternate runtime API.

### Verification strategy

Use pure tests for snapshot immutability, allowed state transitions, failed-check blockers, nonnegative cost/minute arithmetic, exception preservation, unknown references, duplicate restoration IDs, selection separation, schema size limits and corrupt-store preservation. Test actual outcomes separately from planning counts. A browser pass should exercise a complete synthetic run, export/reload/restore it, switch workspace, change the source batch, and verify mobile/keyboard access and clear local-only language. Reuse existing plan fixtures; do not add tests that merely mirror display text.

For Tavily, retain injected upstream tests and a separate real deployed proof. For Review, keep existing role/tenant, approval freshness, unchanged-test and private-runner checks. Passing local Pilot Desk tests does not expand Review's security claims.

## Enterprise sequencing

The selected 200 capabilities form ten investment modules below. They are deliberately not 200 toggles. Each row represents an outcome with its own acceptance gate. Dependencies are explicit at module level; refine each row into a scoped design and failure cases before assigning a delivery date.

| Module | 20-capability outcome | Boundary and dependencies | Delivery order |
| --- | --- | --- | --- |
| EX01 | Evidence lifecycle | Review evidence foundation plus artifact storage, provenance and technician policy | First shared pilot extension |
| EX02 | Intake and asset control | Shared asset identity, authorization, receipt ledger and conflict handling; depends on EX08 | After evidence-first pilot |
| EX03 | Qualified parts and compatibility | Vendor authority and qualified technician review; depends on EX01 and EX02 | After source/identity quality is established |
| EX04 | Planning and resilience | Frozen inputs and independently validated objective/constraints; depends on EX02 and EX03 | Local analytical subsets first; shared commitments later |
| EX05 | Bench execution | Atomic stock ledger, authenticated actors and work history; depends on EX02/EX03/EX08 | Local Pilot Desk subset first; transactional service later |
| EX06 | QA and physical release | Independent reviewers, real test evidence and sanitization provider integration; depends on EX01/EX05/EX08 | Only after real hardware pilot acceptance |
| EX07 | Procurement and economics | Supplier evidence, money precision, approval policy, accounting boundaries; depends on EX02/EX03/EX08 | Estimates first; real orders only with explicit authority |
| EX08 | Organization administration and governance | Supabase identity, domain proof, IdP contracts, retention policy, role lifecycle and recovery | Shared-service prerequisite |
| EX09 | External system integration | Versioned contracts, least-privilege credentials, queues and replay; depends on EX08 | One read-only connector, then qualified writes |
| EX10 | AI evaluation and operations | Held-out fixtures, privacy controls, failure telemetry and measured operations; depends on EX01/EX08 | Start evaluations now; operational SLAs after evidence |

Advance one module only after customer acceptance of its full workflow. Establish a real, consented pilot and record preparation time, review time, blocked/abstained cases, false positives, provider cost and outcome completeness. Do not estimate product-market fit from test counts or use a feature count as a security score.

## Documentation corrections to make with the release

The following statements are historical or too broad. Correct them against the final deployment evidence; do not rewrite historical release receipts as if they were fresh tests.

| Document | Current ambiguity or stale statement | Required correction |
| --- | --- | --- |
| `docs/FEATURES.md:74` | Says "baseline also lacks authenticated shared storage" without separating products | Specify Workshop-only storage; link authenticated Review's actual tenant/job/evidence scope. Do not change workshop catalog rows to shipped merely because a narrower Review control exists. |
| `docs/REVIEW-COMPANY-SETUP.md:7` | Blanket customer self-service signup statement predates the recorded Google return | Distinguish working Google onboarding from deferred confirmation/recovery email delivery and unconfigured company SSO. |
| `docs/REVIEW-COMPANY-SETUP.md:52` | Says actual Auth settings have not been inspected in this pass | Date the old assessment and link the later live Google/redirect release evidence; keep SMTP unresolved. |
| `docs/REVIEW-COMPANY-SETUP.md:66` | Tells private-repository users to use a public pilot because private delivery is later | Link the demonstrated operator-provisioned private verifier guide; retain the one-parser/one-to-four-test restriction and provisioning requirement. |
| `docs/REVIEW-COMPANY-SETUP.md:72` | Lumps all private runners into later work | Separate implemented pinned GitHub Actions private pilot from arbitrary/customer-controlled runner support. |
| `docs/DEVPOST.md:82` | Lists production Auth redirects as an unverified gate alongside SMTP | Link the recorded Google return; preserve the separate delivered-email and corporate IdP gates. |
| `docs/DEVPOST.md:99` | Explicitly says Tavily was not used | Update only after the real deployed Tavily + Nebius test; retain all unrelated limits on Nebius Sandboxes, fine-tuning and customer outcomes. |
| `docs/BACKEND-EVIDENCE.md:38` | Workshop tool inventory lists only the original three tools | Add research with its own request, result, citation, timeout and privacy bounds after implementation; preserve historical receipts. |
| `docs/REVIEW-ENTERPRISE-ROADMAP.md` | "missing sandbox entitlement" and one cloud profile wording can imply live Nebius Sandboxes | Name GitHub Actions as exercised execution; label the Nebius Sandbox adapter unactivated. Keep inference distinct from execution. |
| `docs/RELEASE.md` and `docs/demo-video.md` | Current durations, hashes, default player and links refer to previous cuts | Append replacement release proof with actual durations, media hashes, upload URLs, subtitle/transcript status and verification date. Keep prior entries clearly historical. |
| `docs/SUBMISSION-PACK.md` and published video descriptions | Eligibility/feature wording may lag the new release | Use actual deployed capability names and runtime proof; list unimplemented items as the investment roadmap. Do not claim 200 new shipped capabilities. |

## Selected 200-capability delivery backlog

All rows below are **planned**, copied from stable source stories with explicit acceptance gates. They are a curated execution map, not an addition of another 200 to the existing catalog. Module dependencies above apply to every row. A local prototype can explore a subset of a row, but shared authorization, concurrency or vendor-validation criteria remain required where stated.

### EX01 — Evidence lifecycle

| Stable ID | Capability | Acceptance criterion |
| --- | --- | --- |
| SC-0041 | Structured diagnosis capture | A diagnosis identifies observation, test method, and author |
| SC-0042 | Machine diagnostic import | Serial mismatches prevent automatic association of test results |
| SC-0043 | Evidence freshness rules | Expired tests block affected assumptions until reviewed |
| SC-0044 | Conflicting evidence resolution | Conflict view preserves both results and records resolution rationale |
| SC-0045 | Diagnostic completeness check | Each planned repair lists missing prerequisite test evidence |
| SC-0046 | Test-result provenance | Exported evidence identifies tool version and operator where supplied |
| SC-0047 | Evidence attachment integrity | Modified attachments receive new versions and invalidate dependent approval |
| SC-0048 | Retest scheduling | Queue ranks retests by documented planning consequence |
| SC-0049 | Failure-code normalization | Unknown codes remain unresolved instead of guessed diagnoses |
| SC-0050 | Symptoms-only hold | Symptom records require technician confirmation before allocating replacement parts |
| SC-0051 | Diagnostic confidence labeling | Every confidence label links to its source and limitations |
| SC-0052 | Evidence dependency graph | Changing evidence highlights all dependent proposed assignments |
| SC-0053 | Diagnostic labor accounting | Plan totals include approved diagnostic tasks and their estimates |
| SC-0054 | Partial-test exceptions | Exception records explicitly identify untested components and approval |
| SC-0055 | False-failure review | Original and repeated outcomes remain visible after resolution |
| SC-0056 | Evidence redaction preview | Preview shows exactly which text and attachments will be sent |
| SC-0057 | Diagnostic bundle export | Bundle preserves source records, unresolved conflicts, and identifiers |
| SC-0058 | Evidence-based hold release | Hold closes only when its evidence requirements are met |
| SC-0059 | Test yield feedback | Report separates useful tests from repeated nonresolving assessments |
| SC-0060 | Diagnosis change replay | Replay attributes changed assignments to the revised evidence |

### EX02 — Intake and asset control

| Stable ID | Capability | Acceptance criterion |
| --- | --- | --- |
| SC-0022 | Spreadsheet intake mapping | Preview flags row errors without silently dropping supplied records |
| SC-0023 | Serial deduplication | Duplicate serials require an explicit merge or exception decision |
| SC-0024 | Barcode receiving | Repeated scans cannot create duplicate receipt quantities |
| SC-0025 | Expected shipment reconciliation | Missing and unexpected units appear in a discrepancy queue |
| SC-0026 | Ownership evidence intake | Missing ownership evidence places affected devices on hold |
| SC-0027 | Condition photo capture | Images retain asset identity and capture time after export |
| SC-0028 | Offline receiving queue | Reconnection resolves duplicate receipts before committing stock |
| SC-0029 | Bulk eligibility screening | Every excluded unit receives a rule and reviewable reason |
| SC-0030 | Accessory completeness | Incomplete kits remain distinct from complete device records |
| SC-0031 | Lot provenance | Any asset can be traced to its original receipt |
| SC-0032 | Storage bin assignment | Every active movement updates the assigned bin history |
| SC-0033 | Inventory cycle counts | Count variances require approval before stock adjustments |
| SC-0034 | Duplicate label resolution | Conflicting labels resolve to distinct immutable asset identities |
| SC-0035 | Quarantine intake routing | Quarantined devices cannot enter an approved repair batch |
| SC-0036 | External asset aliases | Exports return the original alias without replacing internal identity |
| SC-0037 | Receiving damage disputes | Dispute packet includes receipt differences and timestamped photographs |
| SC-0038 | Mixed-lot separation | Split batches preserve parent provenance and conserved quantities |
| SC-0039 | Missing-record impact preview | Preview identifies blocked candidates and required missing fields |
| SC-0040 | Inventory aging queues | Queue groups aging units by last action and blocker |
| SC-0085 | Component identity tracking | A recipient allocation resolves to its component and donor lineage |

### EX03 — Qualified parts and compatibility

| Stable ID | Capability | Acceptance criterion |
| --- | --- | --- |
| SC-0062 | Manufacturer part provenance | Approval requires source identity and an exact supported relationship |
| SC-0063 | Hardware revision matching | Disallowed revisions never satisfy a device's requirement |
| SC-0064 | Approval scope boundaries | A family-level reference cannot authorize unspecified variants |
| SC-0065 | Compatibility expiry | Expired approvals invalidate dependent plans until reviewed |
| SC-0066 | Equivalence approval workflow | Alternatives stay blocked until an authorized reviewer approves them |
| SC-0067 | Conflicting source arbitration | Decision retains conflicting sources and the chosen rationale |
| SC-0068 | Firmware dependency mapping | Unmet firmware prerequisites keep the assignment conditional or blocked |
| SC-0069 | Memory population rules | Unsupported slot and capacity combinations fail validation |
| SC-0070 | Storage interface prerequisites | Missing required adapters prevent the complete repair assignment |
| SC-0071 | Connector orientation evidence | Similar-looking components cannot bypass the approved variant relationship |
| SC-0072 | Regional keyboard variants | Assignments preserve required language and layout constraints |
| SC-0073 | Display assembly grouping | A panel without required compatible ancillary parts is rejected |
| SC-0074 | Compatibility evidence diff | Diff identifies dependent plans needing renewed approval |
| SC-0075 | Negative compatibility records | Explicit exclusions override generic positive family-level declarations |
| SC-0076 | Qualified reviewer separation | The proposer cannot approve their own restricted substitution |
| SC-0077 | Compatibility coverage report | Report counts unresolved relationships without inventing missing matches |
| SC-0078 | Batch substitution impact | Preview compares feasible outcomes before committing the approval |
| SC-0079 | Compatibility dispute packet | Packet includes exact identifiers, evidence, and unresolved disagreement |
| SC-0080 | Validated relationship import | Unapproved or dangling relationships remain in a review queue |
| SC-0094 | Reusable-part quarantine | Quarantined quantities are excluded until a recorded release |

### EX04 — Planning and resilience

| Stable ID | Capability | Acceptance criterion |
| --- | --- | --- |
| SC-0107 | Priority policy explanation | Comparison identifies the declared priorities affecting selection |
| SC-0108 | Protected device commitments | Locked assignments remain unchanged unless explicitly released |
| SC-0109 | Deadline-constrained recovery | No candidate is promised before required tasks can complete |
| SC-0110 | Weighted recipient objectives | Every weighting is visible and its effect reproducible |
| SC-0111 | Pareto plan alternatives | Dominated alternatives are excluded and objectives remain inspectable |
| SC-0112 | Marginal component value | Counterfactual result names added stock and changed candidates |
| SC-0113 | Marginal labor value | Comparison changes only the stated capacity assumption |
| SC-0114 | Plan stability objective | Report distinguishes required changes from avoidable reallocations |
| SC-0115 | Budget allocation across batches | Combined spending remains within the organization allowance |
| SC-0116 | Eligibility policy comparison | Scenario outputs retain both policy versions and affected devices |
| SC-0117 | Independent plan validator | Validator rejects resource and compatibility violations in fixtures |
| SC-0118 | Infeasibility explanation sets | Removing a reported blocker set changes feasibility as stated |
| SC-0119 | Repair-versus-defer analysis | Future-demand assumptions are explicit and editable |
| SC-0120 | Reproducible plan snapshots | Snapshot replay yields identical assignments and objective values |
| SC-0145 | Evidence revocation replay | Dependent assignments disappear until replacement evidence is approved |
| SC-0146 | Supplier delay replay | Unavailable arrival dates prevent premature task commitments |
| SC-0147 | Demand surge replay | Preview shows displaced work and approval-dependent changes |
| SC-0148 | Correlated donor failures | Scenario groups fail together without double-counting surviving inventory |
| SC-0149 | Labor uncertainty bands | Every band reports its explicit duration assumptions |
| SC-0150 | Price shock replay | Only affected prices change and budget breaches are exposed |

### EX05 — Bench execution

| Stable ID | Capability | Acceptance criterion |
| --- | --- | --- |
| SC-0165 | Atomic order acceptance | Acceptance fails safely if another order reserved a needed unit |
| SC-0166 | Component picking verification | Incorrect parts cannot be recorded as a completed pick |
| SC-0167 | Installation consumption | Repeated installation events cannot decrement stock twice |
| SC-0168 | Unused-part return | Returned quantities reconcile with prior picks and installed units |
| SC-0169 | Unexpected-fault escalation | Escalation preserves completed work and triggers reviewed replanning |
| SC-0170 | Substitution request at bench | Work cannot continue on an unapproved substitution |
| SC-0171 | Actual labor capture | Actual duration retains corrections and cannot rewrite original estimates |
| SC-0172 | Evidence-linked technician notes | Every note references its order and optional component identity |
| SC-0173 | Work-order revision comparison | Technician acknowledges material changes before using revised instructions |
| SC-0174 | Interrupted repair checkpoint | Checkpoint lists installed parts outstanding work and holds |
| SC-0175 | Locked installation history | Replanning cannot silently reverse completed installation records |
| SC-0176 | Bench material shortages | Shortage pauses affected tasks and names dependent commitments |
| SC-0177 | Concurrent technician coordination | Conflicting changes require reconciliation rather than silent overwrite |
| SC-0178 | Repair completion attestation | Completion requires installed-part reconciliation and unresolved-fault review |
| SC-0179 | Rework order linking | Rework preserves prior attempts and separates additional labor |
| SC-0180 | Proof-carrying work packets | Packet includes assignment provenance version and pending acceptance checks |
| SC-0121 | Technician skill eligibility | Tasks reject technicians lacking required recorded qualifications |
| SC-0122 | Shift calendar capacity | Absence and break intervals reduce schedulable capacity |
| SC-0124 | Task dependency scheduling | No task begins before its required predecessor completes |
| SC-0135 | Handover-ready checkpoints | Handover identifies device state and remaining prerequisites |

### EX06 — QA and physical release

| Stable ID | Capability | Acceptance criterion |
| --- | --- | --- |
| SC-0181 | Independent QA sign-off | Restricted releases require a reviewer other than the repairer |
| SC-0182 | Model-specific test templates | Required tests follow the approved model template version |
| SC-0183 | Release blocker dashboard | Every held release links to an unresolved mandatory requirement |
| SC-0184 | Test result attachments | Release record retains test result author date and asset identifier |
| SC-0185 | Battery condition policy | Below-threshold or untested batteries prevent release under that policy |
| SC-0186 | Supported software review | Unsupported or unknown software status blocks release where required |
| SC-0187 | Accessory release checks | Incomplete required kits cannot receive final release approval |
| SC-0188 | Data-wipe release gate | Missing or rejected wipe evidence blocks release independently of repair |
| SC-0189 | Cosmetic grade review | Grade follows the chosen rubric and retains reviewer evidence |
| SC-0190 | Functional regression detection | New failed tests reopen work with previous results preserved |
| SC-0191 | QA sampling policy | Sample selection and exceptions are reproducible and recorded |
| SC-0192 | Repeat-failure containment | Containment identifies matching lot or component relationships |
| SC-0193 | Conditional release approval | Exception includes scope approver rationale and recipient disclosure |
| SC-0194 | Release readiness forecast | Forecast lists each unverified release dependency explicitly |
| SC-0195 | Recipient requirement QA | Release fails if a required recipient capability remains unverified |
| SC-0196 | QA evidence expiry | Expired checks reopen only the affected release requirements |
| SC-0197 | Golden-reference comparison | Differences retain reference version and technician interpretation |
| SC-0198 | Failed-QA recovery replan | Replan preserves installed components and records newly required work |
| SC-0199 | Release packet generation | Packet excludes private donor data and unsupported certification claims |
| SC-0200 | Release audit sampling | Audit distinguishes missing evidence from failed physical outcomes |

### EX07 — Procurement and economics

| Stable ID | Capability | Acceptance criterion |
| --- | --- | --- |
| SC-0221 | Approved supplier register | Unapproved suppliers cannot receive automatically prepared order requests |
| SC-0222 | Quote comparison | Comparison includes quantity lead time taxes and shipping assumptions |
| SC-0223 | Exact-SKU purchase requests | Requests cannot replace missing identifiers with model-name guesses |
| SC-0224 | Purchase approval limits | Orders exceeding a role's authority remain unsubmitted |
| SC-0225 | Receipt against purchase order | Overages shortages and substitutions enter an exception queue |
| SC-0226 | Supplier compatibility evidence | Unproven substitutions remain unavailable to the allocator |
| SC-0227 | Delivery-date feasibility | Plans show why late quotes cannot satisfy commitments |
| SC-0228 | Marginal purchase bundles | Bundle preview reports incremental spending and changed recovery candidates |
| SC-0229 | Minimum-order trade-offs | Unused purchased quantities remain visible in cost projections |
| SC-0230 | Shipping consolidation | Consolidation reports shipping savings and changed arrival assumptions |
| SC-0301 | Incremental cash separation | Reports never treat sunk inventory value as new purchase cash |
| SC-0302 | Actual repair cost ledger | Each total reconciles to recorded source transactions |
| SC-0303 | Lot acquisition allocation | Method version and per-device allocations sum to the lot total |
| SC-0304 | Contribution-margin planning | Margin reports separate estimates from realized revenue |
| SC-0305 | Cost-to-complete estimates | Already incurred costs are not counted twice |
| SC-0306 | Donation program budgets | Ineligible charges cannot consume the restricted budget |
| SC-0307 | Invoice reconciliation | Quantity or price differences require approval before posting |
| SC-0308 | Technician rate schedules | Cost calculations retain the effective rate and date |
| SC-0309 | Overhead scenario modeling | Scenario labels prevent estimates from appearing as posted accounts |
| SC-0310 | Repair break-even analysis | Threshold includes visible assumptions and uncertainty bounds |

### EX08 — Organization administration and governance

| Stable ID | Capability | Acceptance criterion |
| --- | --- | --- |
| SC-0002 | Verified company enrollment | Activation requires a verified domain or reviewed ownership evidence |
| SC-0004 | Site-scoped access | A technician cannot access another site's restricted inventory |
| SC-0005 | Multi-factor enforcement | Privileged sessions require a second factor before sensitive actions |
| SC-0006 | Enterprise single sign-on | Disabled identity-provider users cannot start new application sessions |
| SC-0007 | Provisioning lifecycle | Deprovisioning revokes active sessions and pending invitations |
| SC-0009 | External partner access | Partners see only explicitly assigned orders and attachments |
| SC-0010 | Temporary escalation | Elevated permission expires automatically with a retained reason |
| SC-0011 | Session management | Revoked sessions fail their next authenticated operation |
| SC-0012 | Service identities | Revoking one credential leaves unrelated integrations operational |
| SC-0013 | Workspace ownership transfer | Transfer requires acceptance and preserves audit ownership history |
| SC-0016 | Department cost-center mapping | Orders reference only active authorized cost centers |
| SC-0017 | Delegated administration | Site administrators cannot change company-wide security policies |
| SC-0018 | Account recovery review | Recovery records verification and revokes superseded credentials |
| SC-0020 | Company shutdown export | Closure produces an export and follows approved retention rules |
| SC-0362 | Policy version registry | Every active policy has a version owner and effective date |
| SC-0364 | Evidence access auditing | Audit records identify the requested record and authorized actor |
| SC-0365 | Retention policy management | Expired records enter controlled deletion unless an exception applies |
| SC-0366 | Record preservation holds | Deletion jobs respect scoped holds and record their release |
| SC-0367 | Audit packet export | Packet includes only selected records and a manifest |
| SC-0368 | Policy exception register | Exceptions require scope rationale approver and expiry |

### EX09 — External system integration

| Stable ID | Capability | Acceptance criterion |
| --- | --- | --- |
| SC-0381 | Versioned import contracts | Unsupported schema versions fail with migration guidance |
| SC-0382 | ERP disposition synchronization | Idempotent posting prevents duplicate inventory or financial events |
| SC-0383 | Warehouse stock reconciliation | Conflicts are reviewed before changing allocatable stock |
| SC-0384 | Diagnostic provider adapter | Adapter preserves original results and mapping version |
| SC-0385 | Erasure evidence adapter | Only matching signed or reviewable evidence reaches the asset record |
| SC-0386 | Carrier event adapter | Duplicate events do not duplicate delivery outcomes |
| SC-0387 | Procurement order exchange | Returned external identifiers link to the original approved request |
| SC-0388 | Supplier stock feed | Stale feed data cannot appear as confirmed on-hand inventory |
| SC-0389 | Approved manufacturer catalog import | Imported relationships remain unapproved until reviewed |
| SC-0390 | Kaggle dataset registry | Each dataset records license provenance purpose and prohibited assumptions |
| SC-0391 | Dataset-to-fixture conversion | Generated fixtures preserve provenance and never imply real compatibility |
| SC-0392 | Event webhook subscriptions | Delivery includes signatures retries and deduplication identifiers |
| SC-0393 | Inbound webhook quarantine | Invalid signatures or unknown sources cannot mutate inventory |
| SC-0394 | Bulk export contracts | Schema version and extraction timestamp accompany each export |
| SC-0395 | Legacy migration reconciliation | Migration cannot close until material discrepancies are resolved |
| SC-0396 | Connector credential rotation | Old credentials stop working after the approved transition |
| SC-0397 | Integration failure replay | Replay preserves event identity and produces one final effect |
| SC-0398 | Read-only partner APIs | Partner scopes exclude private fields and mutating operations |
| SC-0399 | External identifier crosswalk | Ambiguous identity matches require review before synchronization |
| SC-0400 | Reversible connector sandbox | Sandbox traffic cannot create production orders or stock movements |

### EX10 — AI evaluation and operations

| Stable ID | Capability | Acceptance criterion |
| --- | --- | --- |
| SC-0405 | Field-level extraction review | Accepted edits retain source text and reviewer attribution |
| SC-0408 | Aggregate semantics checks | Generated source attribution agrees with actual stock and donor allocations |
| SC-0409 | Adversarial evidence evaluation | Malicious evidence cannot expand tools or alter approved inventory |
| SC-0410 | Golden intake evaluation set | Scores disclose cases fields corrections and missing-information criteria |
| SC-0411 | Tool-policy regression suite | Regression catches unauthorized calls missing planning and excess rounds |
| SC-0412 | Model version comparison | Evaluation uses fixed inputs and reports quality latency and cost |
| SC-0413 | Reasoning budget controls | Completion settings prevent unbounded reasoning and fail explicitly on limits |
| SC-0414 | Human correction learning queue | Private corrections require authorization before dataset reuse |
| SC-0415 | Confidence-aware abstention | Unsupported fields remain missing rather than inferred as facts |
| SC-0417 | Plan-difference narration | Narration mentions only verified differences between stored snapshots |
| SC-0418 | Policy-aware prompt registry | Each deployed prompt has an approved version and rollback target |
| SC-0419 | Private evaluation fixtures | Evaluation access and export follow the originating workspace policy |
| SC-0420 | Agent cost attribution | Usage totals include retries and exclude fabricated cost estimates |
| SC-0491 | Operational health monitoring | Alerts identify affected operations without containing private payloads |
| SC-0492 | Incident response runbooks | Exercises record owners communications and restoration decisions |
| SC-0493 | Audit log integrity checks | Tampering triggers an alert and preserves available evidence |
| SC-0495 | Secret rotation workflow | Revoked credentials fail and dependent services use approved replacements |
| SC-0496 | Regional data controls | Operations outside the configured region policy are blocked or disclosed |
| SC-0497 | Session anomaly review | Alerts cite observed events and require human assessment |
| SC-0500 | Recovery-time validation | Actual recovery measurements remain distinct from promised targets |

