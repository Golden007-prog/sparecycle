# SpareCycle: release-readiness checklist

Release progress recorded on 10 October 2026. The manual planner is publicly deployed, real intake succeeded, and delivered intake/planner-tool trace records were inspected. Full batch-agent completion remains pending. A configured key alone does not prove successful inference or trace delivery. See [VALIDATION.md](VALIDATION.md) for the evidence ledger.

## Local application

- [x] Run the complete current test suite and production build: 37 tests passed (23 API, 11 domain, 3 export); build passed. Final source commit remains to record.
- [ ] Complete the workshop flow on desktop and a narrow mobile viewport, including keyboard navigation and dialog focus.
- [x] Verify the 390-pixel mobile layout without horizontal overflow and mobile-navigation focus/visibility behavior.
- [x] Import a valid one-device JSON batch, observe one projected candidate, restore the seven-candidate demo, and reject an invalid batch.
- [ ] Import valid JSON and reject invalid references, quantities, limits, and oversized inputs with understandable errors.
- [x] Verify the synthetic default: $25 and 180 minutes produce seven projected candidates versus five for the intake-order baseline; disabling the donor RAM produces six. Browser confirmation recorded.
- [ ] Check zero budget, zero time, unavailable stock, unknown compatibility, tied results, and bounded-search wording.
- [ ] Confirm a changed input invalidates the previous review and explanation.
- [ ] Inspect exact allocations in device dialogs and CSV work orders; the main bench is a schematic overview.
- [ ] Open CSV and JSON exports and verify amounts, proposal status, outstanding checks, and synthetic labeling. CSV imports are not supported.

## Provider and tracing

- [x] Configure server-only Nebius credentials and record the successful model: nvidia/Nemotron-3_5-Lightning.
- [x] Make a successful real intake request; observed latency 9.35 seconds.
- [ ] Complete a systematic field-quality evaluation of intake drafts and missing-information handling.
- [ ] Make a real batch-review request; record actual executed tools and check the independently returned deterministic plan.
- [ ] Verify explicit provider-error behavior without a simulated AI fallback.
- [ ] If LangSmith is enabled, inspect a delivered trace and confirm inventory, notes, prompts, arguments, and generated text are hidden. A returned trace ID alone is insufficient.
- [x] Inspect delivered intake-root and compute_recovery_plan trace records with empty inputs/outputs; retain the full successful-agent inspection as pending.
- [ ] Record actual latency and usage for platform feedback. Keep account keys and private records out of evidence.

## Public release

- [ ] Publish the intended source and visible MIT license; exclude credentials, private data, and generated secrets.
- [x] Deploy to Vercel with production server configuration: https://sparecycle-topaz.vercel.app.
- [x] Confirm anonymous HTML HTTP 200 and a loaded manual planner.
- [ ] Check the production alias anonymously, including the interface, health route, and a real AI request.
- [ ] Verify public judge access, imports, planning, failure replay, and exports against the deployed version.
- [ ] Replace live/repository/model-verification placeholders in README and the Devpost draft with actual evidence.
- [ ] Record deployment URL, commit, date, browser checks, known limitations, and provider-test results.

## Submission

- [ ] Record and publish the working demonstration as a public YouTube video of at most three minutes.
- [ ] Reconcile submission claims with the shipped interface: JSON import; CSV/JSON exports; schematic overview; exact allocations in inspection; synthetic outcomes.
- [ ] Complete genuine platform feedback and the eligibility checklist in DEVPOST.md.
- [ ] Submit through Devpost and record submission confirmation. Deployment alone is not submission.
- [ ] Keep the demo accessible to judges for the required period.

## Release record

| Evidence | Result |
| --- | --- |
| Public repository | [Golden007-prog/sparecycle](https://github.com/Golden007-prog/sparecycle); created, source push pending |
| Production URL | https://sparecycle-topaz.vercel.app |
| Commit / deployment date | Final commit pending; deployment observed 10 October 2026 |
| Full tests / build | 37 tests passed; production build passed |
| Anonymous browser verification | HTML HTTP 200 and manual planner loaded; default 7 → donor failure 6, identity hold, invalid import checked |
| Actual Nebius model and successful tool run | Lightning intake succeeded in 9.35 seconds; complete batch-agent result pending |
| Inspected LangSmith trace | Delivered intake-root/planner-tool records had empty inputs/outputs; successful full-agent trace pending |
| Public YouTube video | Pending |
| Devpost submission confirmation | Pending |

Current test and browser evidence is documented in VALIDATION.md. It validates the recorded prototype behavior; it does not establish completed physical repairs, customers, or production readiness.
