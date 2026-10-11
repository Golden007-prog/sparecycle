# SpareCycle Review: historical Devpost submission draft

> **Superseded draft, retained as a 10 October 2026 record.** Use the current [submission pack](SUBMISSION-PACK.md), [backend evidence](BACKEND-EVIDENCE.md) and [release record](RELEASE.md). Both videos are now published: [primary competition cut](https://www.youtube.com/watch?v=i21ilQRw4go) and [supporting deep dive](https://www.youtube.com/watch?v=pdLFzA9sT6A). Devpost remains a draft; the last reported progress was 3 of 5 sections, pending eligibility confirmation and verified judge access. The older test counts, public-only scope and unuploaded-video notes below describe the earlier release, not current status.

Editorial draft updated 10 October 2026 for published runtime `97d81a166e2ed3ad9b41ce3795a48eeb9877d9fe`. Its 166 automated tests, production build and [GitHub CI](https://github.com/Golden007-prog/sparecycle/actions/runs/38028508283) passed. Vercel production is READY; live access, tenant isolation and desktop/mobile screens were checked. A fresh Nano investigation succeeded through the deployed app. Real hosted Auth/persistence, four Nebius model tiers, isolated tests and an App-authored draft PR have been exercised. The requested local delivery also built successfully. [VALIDATION.md](VALIDATION.md) distinguishes these observations. The YouTube video and Devpost entry remain unsubmitted.

## Submission fields

- **Name:** SpareCycle Review
- **Tagline:** From a laptop's diagnostic evidence to a tested, independently approved software fix.
- **Track:** Best Apps and Agents
- **Application:** https://sparecycle-topaz.vercel.app
- **Review desk:** https://sparecycle-topaz.vercel.app/review
- **Workshop planner:** https://sparecycle-topaz.vercel.app/app
- **Public source:** https://github.com/Golden007-prog/sparecycle
- **Actual draft PR:** https://github.com/Golden007-prog/sparecycle/pull/1
- **Actual isolated verification:** https://github.com/Golden007-prog/sparecycle/actions/runs/38027193047
- **Public YouTube video:** remaining submission task
- **Built with:** React, Vite, TypeScript, Vercel, Supabase Auth/PostgreSQL, NVIDIA Nemotron through Nebius Token Factory, GitHub App/Actions, LangSmith

## Inspiration

Laptop recovery involves both physical decisions and the software used to make them. A technician may record a valid observation, yet a faulty diagnostic parser can discard it. The result can look like a device problem until someone connects the asset evidence to the code responsible for reporting it.

SpareCycle began with whole-batch refurbishment planning: how should limited tested parts, money and technician time be allocated across laptops? Review extends that evidence discipline to software. Its central product idea is a continuous, inspectable chain from an organization's laptop passport to the specific code change, unchanged tests, separate approval and draft PR. When the evidence points to physical work, the workflow stops for a technician.

Our initial audience is a small refurbishment or IT operations team that owns its diagnostic scripts. We want a coordinator and a developer to be able to inspect the same case without losing its connection to the laptop. Customer demand and competitive exclusivity remain hypotheses to validate.

## What it does

A team signs in, creates an organization, invites a reviewer and registers a laptop passport. Technician notes, diagnostic logs and test results become append-only evidence revisions. The organization connects a selected public GitHub repository and chooses one supported JavaScript diagnostics parser plus its existing tests.

Nebius Nemotron investigates the evidence. A supported software finding can proceed to a patch proposal. The harness preserves the parser's public exports and rejects unsafe syntax, ambient system access, test changes and dependency changes. It runs the original source and proposed source in isolated containers against the same unchanged tests. A fresh model request reviews the actual defect, source diff and proof. A different organization reviewer then approves the exact evidence revision, base commit and patch before the GitHub App creates a draft PR.

Adding evidence invalidates old approval and verification. A changed repository base requires refreshed work. Passing tests alone cannot authorize publication, and a merged software change cannot certify a physical repair.

The demonstrated defect is small and concrete: a battery-log parser rejected a valid zero-percent reading because it treated zero as false. The original suite produced **three passes and one failure**; the candidate produced **four passes** with the same named tests. The App published [draft PR #1](https://github.com/Golden007-prog/sparecycle/pull/1), changing only the parser and leaving the tests unchanged. Approval used separate controlled QA accounts; it was not a real employee's operational decision.

The original Workshop remains available for constrained batch planning, donor-failure replay, CSV/JSON intake and local workspace backups. Its reference catalog has 291 historical laptop listing variants derived from a Kaggle dataset with an uploader-declared CC0 license. Those retailer claims are reference material, not manufacturer-approved compatibility or current prices. [Data provenance](DATA-SOURCES.md) records the source and exclusions.

## How we built it

The React/TypeScript interface preserves the cream, navy and cobalt visual design while separating passports, changes, projects, activity and organization settings. Vercel serves the interface and bounded API stages. Supabase Auth validates users; PostgreSQL membership and row-level security scope shared records to organizations. Transactional operations protect evidence revisions, invitations, approval, job leases and spend reservations. Database access carries the user's JWT, with a separate server proof required for trusted execution results.

**Nebius Token Factory performs every AI call.** The router offers Nano for economical investigation, Lightning for investigation, Super for patching and a new-context model review, and an explicitly enabled Ultra escalation. All four tiers completed actual calls during development. Routing is a deliberate cost/quality hypothesis, not a claim that all endpoints perform equally well. Strict schemas, bounded inputs/outputs, deadlines and no automatic inference retries constrain each stage.

The actual verification provider is **GitHub Actions isolated container**. The runner pins its verifier commit and container image, disables guest networking, removes guest credentials and applies resource limits. It verifies source, evidence and candidate identities and compares named subtests, nesting and order. A separate Nebius Sandboxes adapter exists, but beta access was not activated and is not claimed as used.

The GitHub App mints short-lived tokens scoped to selected repositories. It creates draft PRs after approval; it cannot silently merge through this workflow. LangSmith receives operational metadata with input/output capture disabled. Investigation and patch traces were retrieved and their input/output objects were empty.

## Challenges

Generated code and a plausible explanation are insufficient evidence that a defect was fixed. An early model proposal was effectively comment-only source and did not become an accepted repair. We tightened executable-code and export-preservation checks. Integration testing also found hash differences caused by PostgreSQL JSONB key ordering, which required stable canonical hashing. The review prompt needed the original case evidence to judge the actual reported defect, not merely whether a patch looked reasonable.

The work also exposed a long-running database request. Authentication and database transport now have eight-second deadlines covering response bodies, automatic database retries are disabled, and outages return sanitized errors. Durable reservations and private checkpoints prevent an interrupted model call from being blindly repeated against the same credit allowance.

These failures informed the harness. The final successful example demonstrates one bounded workflow; it does not establish unattended reliability or general-purpose software repair.

## Accomplishments

- **166 source tests and the production build passed**, covering application behavior, authorization, database invariants and provider boundaries.
- The published runtime passed CI and is live on Vercel. Nine production API checks verified configuration, request guards, owner access to the existing published proof and outsider isolation. Desktop/mobile browser checks confirmed the published record and no horizontal overflow in the inspected layouts.
- Three synthetic actors exercised real Supabase authentication, invitations, persisted passports/evidence and tenant separation after three migrations were applied.
- Nano, Lightning, Super and Ultra all completed real Nebius calls. The Nano/Ultra synthetic probes classified the issue as software in 4.775 and 3.639 seconds respectively; those are individual observations, not comparative benchmarks.
- A [real isolated run](https://github.com/Golden007-prog/sparecycle/actions/runs/38027193047) demonstrated a failing baseline and passing candidate against unchanged tests. The selected-repository App then authored a draft PR containing only the reviewed parser change.
- A subsequent investigation through the stable production URL completed with Nano, classified the synthetic issue as software and used no inference retries. This new case produced no patch, approval or PR; the complete PR workflow is the separate case above.
- Retrieved investigation and patch traces contained empty input/output objects. The pilot ledger recorded 11 cents before the final production Nano call; that historical conservative bookkeeping is not the current balance, a provider bill or a measured commercial unit cost.
- The requested local delivery was synchronized to the published runtime, installed from the dependency lockfile and built successfully. Its targeted source/bundle credential-exclusion scan reported no issues; existing private settings and the user's untracked batch template were preserved.

The complete evidence, identities, failures and limitations are in [VALIDATION.md](VALIDATION.md). These checks use synthetic laptop evidence, not physical repair outcomes or customer data.

## What we learned

The useful product is the connection between evidence and an accountable action. A laptop passport matters when a new observation can invalidate an outdated conclusion. Test proof matters when it binds to the exact source and unchanged tests. Approval matters when another person must inspect that specific result before publication.

The system also needs an honest stopping point. Hardware findings require technician work; unsupported code requires another execution profile; private enterprise repositories require a qualified private runner. Visible uncertainty is part of the workflow.

## What's next and business scope

The first design-partner pilot should pair a refurbishment or managed-IT team with its diagnostic-script maintainer. Measure time from a reviewed evidence bundle to an accepted change, reviewer corrections, abstentions, regression rate and total cost. A workspace subscription with usage-based execution is a pricing hypothesis to validate after those measurements; no customers, revenue or measured operational savings are claimed.

Enterprise expansion needs SSO/SAML/SCIM, customer-controlled private runners, retention/deletion policy, measured backup restoration, external security assessment and supported hardware validation. Customer SMTP, production Auth redirects and the complete delivered-email recovery flow remain readiness gates. Recovery/resend screens exist, but interface tests do not prove mail delivery.

The [200-item enterprise map](review-enterprise-backlog.csv) contains 8 foundation mappings, 20 narrow pilot mappings, 129 later items and 43 requiring domain validation. These are not 200 shipped capabilities. The earlier 520-story catalog is also a planning artifact. We prioritize a reliable evidence-to-PR path over a claimed feature count. [Enterprise acceptance gates](REVIEW-ENTERPRISE-ROADMAP.md) describe the next work.

## Judge testing instructions

1. Open [the deployed Review desk](https://sparecycle-topaz.vercel.app/review) and explore the clearly labeled synthetic workspace. It does not pretend to run live models or tests.
2. Inspect the public verification run and App-authored draft PR linked above; the baseline/candidate proof and single-file scope can be checked without a login.
3. For the authenticated flow, use dedicated judge accounts supplied through Devpost's private testing instructions after account delivery and access have been verified. Never commit passwords or place QA credentials in this public document.
4. Follow the [company setup guide](REVIEW-COMPANY-SETUP.md) to view the laptop evidence, exact patch, tests and separate-account approval. New billable jobs remain subject to the documented pilot quotas; arrange adequate free judge access before submission.

No judge credentials are asserted to have been provisioned by this draft. The deployment was verified with controlled QA accounts; separately verify judge account delivery and judging-period availability before submitting.

## Platform feedback

Token Factory's compatible inference interface let the same bounded harness call four NVIDIA model tiers. Structured JSON and provider usage metadata made routing and cost reservations practical. Model-specific reasoning settings, strict executable-output checks and evidence-grounded review still mattered: an early malformed proposal was blocked and the prompt/harness needed refinement. Separately activated Sandbox entitlement was unavailable, so the demonstration identifies GitHub Actions as the actual execution provider while keeping all inference on Nebius.

We used Nebius Token Factory and NVIDIA Nemotron; we do not claim Nebius AI Cloud deployment, Serverless Jobs, live Nebius Sandboxes, Tavily, fine-tuning, local NVIDIA hardware or a completed customer pilot. The earlier Workshop's real tool calls and synthetic allocation comparison remain recorded as historical evidence.

## Eligibility and submission checklist

The official rules were rechecked on 10 October 2026. Required runtime use is met by NVIDIA model calls through Token Factory; external frontend hosting does not imply Nebius AI Cloud deployment. [Official project and track requirements](https://nebiusglobalaihackathon.devpost.com/rules).

- [ ] Confirm entrant eligibility, ownership, licenses and acceptance of the official rules.
- [ ] Select Best Apps and Agents and reconcile this draft with the final deployed build.
- [x] Record the published source commit and READY Vercel deployment; verify production routes and controlled QA access.
- [ ] Provision and verify dedicated judge access and delivery of its private testing instructions.
- [ ] Keep the repository public with its MIT license and complete setup instructions.
- [ ] Upload a public YouTube demonstration **under three minutes** showing the working product.
- [ ] Supply English description, testing instructions and genuine platform feedback.
- [ ] Submit by **30 October 2026, 10:30 p.m. IST** (10 a.m. PDT).
- [ ] Provide free, unrestricted judge access until judging ends, **15 December 2026, noon Pacific Time** (16 December, 1:30 a.m. IST).

Dates, video and testing requirements come from the [official rules](https://nebiusglobalaihackathon.devpost.com/rules); recheck them before submission. Publishing this draft, source or application does not submit an entry. No outcome is guaranteed.
