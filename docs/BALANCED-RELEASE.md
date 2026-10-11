# Balanced workshop and developer release

Prepared 11 October 2026. This document describes implemented behavior; deployment and test results are recorded in RELEASE.md. The separate 200-capability plan remains a roadmap, not a feature-completion claim.

## Official-source research

- Dedicated research desk reachable from the workshop and developer review.
- Public model and question input with bounded validation and reference-focused examples.
- One runtime Tavily Search request over approved manufacturer domains.
- Configurable server-only API-key or explicit keyless mode; missing configuration is reported honestly.
- HTTPS source validation, sensitive-parameter rejection and bounded provider responses.
- Exact model-identifier screening, including generation and suffix exclusions where identifiable.
- Nebius Nemotron Lightning synthesis over untrusted reference excerpts.
- Structured findings bound to returned citation identifiers; unsupported citations rejected.
- Visible uncertainty, source excerpts, timestamps and request metadata.
- Empty-match abstention without an unnecessary model call.
- Cancellation, stale-response protection and copyable reference brief.
- Shared request deadline, rate and concurrency limits; metadata-only tracing.

References are not physical verification, compatibility approval or repair instructions. Public questions must exclude confidential information. Keyless availability and quotas depend on Tavily. Production-wide distributed quotas remain future work.

## Workshop pilot operations

- Freeze a recomputed recovery plan with its original inputs and resource limits.
- Keep multiple runs per workspace and select a saved run.
- Assign a technician and a calendar due date to each planned device.
- Queue, start, block, resume, complete and reopen work with explicit reasons.
- Record actual time and integer-currency parts expenditure in a bounded ledger.
- Correct a work record by voiding it with an explanation rather than deleting it.
- Append bounded device notes and preserve earlier work history.
- Record functional, sanitization and accessory checks with evidence references.
- Require completed work and all three current checks for declared checklist readiness.
- Invalidate old checks after new work, blocking, reopening or workspace recovery.
- Detect stale checks and inconsistent timestamps in restored backups.
- Compare recorded effort and spending with the frozen plan.
- Flag input changes without silently rewriting the saved plan.
- Archive and reopen runs; archived runs cannot be edited.
- Export declared device handoffs with a readable JSON preview and copy fallback.
- Validate backups and add restored runs without overwriting originals.
- Explicitly copy a foreign-workspace backup, preserve history, and reset its QA.
- Pause unsafe writes when browser storage is unavailable; enforce bounded storage limits.
- Responsive interface and reload persistence.

These are browser-local, user-entered records. They do not synchronize across staff, reserve real inventory, certify data erasure or prove a physical repair. Shared work orders, trustworthy identities, conflict resolution and audited operational storage require further implementation.

## Developer review insights

- Search loaded change requests by safe visible labels.
- Filter by status, connected project, laptop-only work, Nemotron route and requester.
- Sort by recently updated or oldest first; reset filters in one action.
- Display loaded counts for attention, approval, published drafts and active jobs.
- Detect delayed job updates without declaring a test failure.
- Compare passport evidence revisions with request revisions.
- Compare recorded tests and approval with the exact base and candidate references.
- Distinguish recorded baseline failure/candidate success from unestablished proof.
- Show whether the recorded approver is a different account.
- Surface absent or inconsistent references next to each request and in its detail panel.
- Preview a redacted JSON handoff before copying or saving it.
- Preview an allowlisted, spreadsheet-safe activity CSV.
- Replace identifiers with local aliases and omit evidence, code, names, paths, URLs, hashes and credentials.
- State export coverage and loaded-record limits explicitly.

Insights are descriptive. Existing server authorization, evidence-version binding, isolated tests, separate human approval and draft-only PR publication remain the enforcement path. No new queue action can merge code, approve a request or claim that tests just ran.

## Remaining expansion

The 200 planned capabilities in EXPANSION-PLAN.md include shared workshop operations, durable orchestration, customer-managed retention, organization SSO/SCIM, wider repository profiles, device integrations and measured field pilots. A story is complete only when its entire acceptance condition is implemented and validated. Partial foundations are not promoted to shipped status.
