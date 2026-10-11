# SpareCycle: investment roadmap

**Prepared 11 October 2026. Proposed priorities, acceptance gates and allocation—not a list of shipped capabilities, a revenue forecast, or a compliance certification.** The code audit used commit `1090733`; the accompanying [research notes](INVESTMENT-RESEARCH-NOTES.md) explain the evidence and uncertainties.

## Start with one buyer and one expensive interruption

The best initial customer hypothesis is a **laptop refurbishment or IT asset disposition (ITAD) operator with an internal diagnostics engineering team**. Its repair/operations lead owns the outcome; a diagnostic-tool maintainer and QA lead are the champions. The team must control its diagnostic repository and have permission to use its device evidence. Validate that this segment has enough repeated software-related diagnosis failures before investing in broad sales.

The first use case is **turning a recurring diagnostic-parser defect into an evidence-backed, tested draft PR**. A technician records the laptop and observed failure. Nebius Nemotron investigates the evidence; hardware cases and insufficient evidence stay with qualified staff. For a supported software case, SpareCycle proposes a bounded parser change, runs the existing tests against the original and candidate versions, records a separate model review, and requires another organization member's approval before publishing a draft PR. The customer's existing merge and release process remains authoritative.

For example, a diagnostic parser might misclassify a reported battery state because it mishandles a valid input format. Fixing the parser could prevent repeated misdiagnosis across a batch. That is a **pilot hypothesis**: the app has not demonstrated a physical battery repair, verified a customer's workshop improvement, or established how often such defects occur.

The differentiation to validate is the connection between **asset evidence, a reproducible software failure, unchanged tests, an accountable reviewer, and the later workshop decision**. Model access and feature counts alone do not establish a defensible business. A repair shop without a maintained codebase is a better candidate for the Workshop planning product; a general software team is outside this first go-to-market focus.

## What exists and what investment must prove

The [recorded private pilot](REVIEW-PRIVATE-REPOSITORIES.md#recorded-private-pilot-verification) used a real private GitHub workflow with synthetic source and evidence: one failing baseline test became four passing candidate tests, and a separate synthetic reviewer approved a draft PR. This demonstrates the controlled integration. It is not evidence of customer adoption or hardware recovery.

Today, Review supports a single pure JavaScript diagnostic module with restricted operations and up to four existing test files through the company API. Private verification requires manual operator binding, a pinned workflow and a repository transport key. Organization roles, database isolation, evidence versioning, budget reservations and separate-person approval are implemented. Google sign-in is distinct from managed company SSO. Customer email delivery, company identity enforcement and real workshop outcomes still need verification or implementation.

Workshop's planning and browser-local company data are a separate workflow from Review's shared organization records. Joining them safely requires a shared data model and real inventory transactions; a visual link alone would not make them one operational system.

## Now: earn a repeatable, bounded company pilot

Ordered by dependency. These are proposed gates for the next funded phase; no calendar estimate is implied.

| Priority | Investment | Acceptance gate before expanding use | Measure |
| --- | --- | --- | --- |
| 1 | Reliable onboarding and access lifecycle | Customer-approved email sender delivers confirmation and recovery to external company inboxes; bounce/rate-limit handling is tested. Owners can revoke invites and memberships, change roles safely, and recover ownership. Revoked users fail their next protected API request, including with a still-valid login token. | Signup completion, delivery failures, support-assisted onboarding, revocation-test pass rate. |
| 2 | Guided private repository setup | A company administrator can install the selected-repository App, authorize access, configure its verifier, rotate its transport key and finish a real smoke test using a checklist in the UI. Replace manual user-token entry with an appropriate GitHub authorization flow. Wrong tenant, moved pin, missing key, revoked App, visibility changes and malformed proof fail closed. | Time to first verified private draft; operator interventions; failed setup reasons. |
| 3 | Durable execution and accountable costs | Durable dispatch, lease expiry, crash recovery and reconciliation cover every external side effect. Inject failures before and after provider/runner responses: every job reaches a terminal or explicitly recoverable state, without duplicate publication. Cancellation is propagated where supported; unresolved remote work remains visible and conservatively charged until settled. | Stuck jobs, duplicate side effects, cancellation settlement time, unreconciled usage. |
| 4 | Operational readiness | Choose recovery objectives with the pilot customer, then demonstrate restore into an isolated environment. Add alerting, redacted request/stage correlation, dependency failure dashboards and a support runbook. Re-run isolation and permission tests after migrations. | Restore time/data loss measured in drills; incident response time; stage error and latency distributions. |
| 5 | Prove the buyer and outcome | Recruit consenting design partners; register eligible cases and existing workflow baselines before exposing AI results. Include failed, rejected and abstained cases. Obtain explicit buyer feedback and a paid-pilot decision without assuming a contract or price. | Accepted fixes, technician time, repeated defect rate, implementation support hours, observed willingness to pay. |

**Pilot release gate:** zero known unresolved critical isolation, credential-disclosure or unauthorized-publication findings; all agreed failure-injection scenarios recover safely; the customer completes the supported workflow and understands its limits. Passing tests is a release condition, not a guarantee that all vulnerabilities are absent.

## Next: make the workflow an organizational system

Proceed only after the first customer workflow is repeatable and its value measured.

1. **Company identity enforcement.** Add organization-to-IdP policy, server-verified session provenance, enforced login method, MFA policy where supported, deprovisioning, owner recovery and audit export. Test password/social-login bypasses and account-linking edge cases. A custom OIDC button is already available for configuration; it does not supply these controls. SAML is a provider/plan decision when a buyer requires it. [Supabase custom providers](https://supabase.com/docs/guides/auth/custom-oauth-providers), [project SAML SSO](https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml).
2. **Shared Workshop and Review records.** Move company inventory and batch state into the organization model; use transactional part reservations and stable asset identifiers. A concurrent reservation test must prove that a part cannot be allocated twice. Preserve import/export and a recoverable migration from local browser data.
3. **Authentic bench evidence.** Introduce a consented, read-only collector or a verified diagnostic-tool integration with device binding, timestamps, provenance and replay detection. Attach actual technician QA and approved sanitization-tool evidence before recording physical release. The release gate is a validated bench procedure, not an AI assertion. NIST's current sanitization guidance informs the evidence process; SpareCycle cannot generate proof that erasure occurred. [NIST SP 800-88 Rev. 2](https://csrc.nist.gov/pubs/sp/800/88/r2/final).
4. **One additional execution profile at a time.** Choose the next language or dependency profile from measured pilot demand. Fund a separate threat model, dependency policy, immutable runner image, resource/egress controls and representative adversarial tests. Keep the current restricted profile available; do not enable arbitrary builds by removing its guards.
5. **Measured Nemotron routing.** Build a consented, held-out evaluation set of software, hardware and insufficient-evidence cases. Compare Nano, Lightning and Super on accepted fixes, abstention quality, latency and total cost; enable Ultra only where measured benefit justifies it. Include failed calls and verification costs. Keep fresh model review plus separate human approval, and test correlated model errors rather than calling two model passes independent evidence of truth.

## Later: scale only after customer and workload evidence

- **Capacity and residency:** evaluate dedicated Nebius endpoints when measured load or a contractual location requirement warrants them. Public endpoints use shared capacity and may change processing region; dedicated endpoints provide configured regional capacity with a different cost model. Current public inference is not a fixed-residency guarantee. [Nebius endpoint comparison](https://docs.tokenfactory.nebius.com/ai-models-inference/dedicated-endpoints/overview).
- **Fleet integrations:** add read-only MDM/ITSM imports first. Any future write action requires scoped authorization, canary rollout, rollback and customer change control. BIOS updates, erasure and hardware control need separate safety work.
- **Procurement readiness:** fund independent security assessment, incident exercises, subprocessor/data-processing review, retention/deletion controls and evidence collection for any certification a real buyer requests. Supplier certifications do not certify SpareCycle.
- **Outcome intelligence:** develop cross-case recommendations only with appropriate consent, tenant isolation and evaluation. Environmental reporting requires actual device outcomes and a defensible lifecycle method; neither an AI estimate nor an e-waste statistic is a verified carbon reduction.

## Proposed allocation of the next product investment

This is a prioritization hypothesis, totaling **100%**, not an estimate of required capital, booked spend or financial return. Reallocate after the pilot gates reveal the bottleneck.

| Share | Workstream | Funded result |
| ---: | --- | --- |
| 30% | Security and execution reliability | Tenant lifecycle, durable jobs, cancellation settlement, private verifier hardening. |
| 25% | Customer pilots and evidence quality | Workflow observation, consented cases, bench QA linkage, recorded baselines and support. |
| 20% | Onboarding and workflow integration | Customer email, repository setup, shared inventory design, clear failure recovery. |
| 15% | AI evaluation and supported profiles | Held-out evaluations, model routing, one justified next execution profile. |
| 10% | Operations and governance | Monitoring, restore drills, retention, incident procedures and procurement evidence. |

An initial commercial hypothesis is a company subscription with included usage and explicit spending caps, possibly coupled to a bounded paid pilot. Test the buyer's preferred value metric before selecting seats, cases or assets as the billing unit. Do not charge for a claim of physical repair on the basis of a draft PR.

## Scorecard: definitions before targets

Record denominators, case eligibility, time windows and missing data. Establish a real baseline before setting improvement targets.

| KPI | Definition / collection rule |
| --- | --- |
| Time to first value | Elapsed company setup time to its first correctly verified, separately approved draft PR; count operator help separately. |
| Supported-case coverage | Cases eligible for the current profile divided by all consented intake cases assessed; expose unsupported cases. |
| Accepted-fix rate | Changes accepted by the customer's reviewer divided by all eligible software cases started; report rejection, abstention and failure separately. |
| Time to accepted draft | Median and tail elapsed time from complete evidence to reviewer acceptance, with waiting and active work separated. |
| Regression/reopen rate | Accepted changes reopened for correctness issues within a predeclared follow-up window; identify cases with incomplete follow-up. |
| Technician time | Observed active minutes on comparable cases, including review and correction—not the duration of an AI call. |
| Physical release yield | Devices independently passing the customer's release QA divided by eligible intake devices; stratify by severity, available parts and time budget. A PR alone cannot increment this metric. |
| Cost per accepted fix | All inference, verification, storage and attributable support costs across the cohort divided by accepted fixes; undefined when none are accepted. |
| Isolation and authorization | Adversarial cross-organization and permission scenarios passed; track incidents separately from test coverage. |
| Reliability | Jobs with terminal or recoverable outcomes, age of unresolved jobs, duplicate writes and cancellation settlement time. |
| Retention and demand | Organizations returning for another eligible batch and buyers agreeing to a defined pilot; avoid treating signups as paying customers. |

## Suggested investment-video narration

“Our first customer hypothesis is a refurbishment company that maintains its own diagnostic software. SpareCycle connects laptop evidence to a tested change and a separate person's approval. The private demonstration proves this controlled software workflow; it does not prove that a laptop was physically repaired. Investment first makes company onboarding, private setup and job recovery dependable. Next we measure accepted fixes, technician time and devices released after real QA. Enterprise identity, shared inventory and broader languages follow those gates. We will choose larger Nebius capacity from measured demand, and publish outcomes only when real customer evidence supports them.”
