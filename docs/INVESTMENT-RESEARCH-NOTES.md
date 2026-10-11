# SpareCycle investment research notes

**Research and code audit: 11 October 2026.** Read with the [proposed investment roadmap](INVESTMENT-ROADMAP.md). Implementation findings refer to repository commit `1090733`; provider documentation can change. This is product research, not a legal applicability opinion or an independent security assessment.

## TL;DR

- Start with refurbishment/ITAD teams that own diagnostic software; customer demand is still a hypothesis.
- A real private synthetic workflow reached a tested draft PR; physical repair and customer outcomes remain unproven.
- Fund dependable onboarding, membership lifecycle, private setup, durable jobs and measured pilots before broadening execution.
- Repair/reuse policy and sanitization requirements support evidence quality; they do not establish SpareCycle's market size or certify its results.
- Use the roadmap's gates and KPI definitions to decide the next investment, not a feature count.

## Questions and search method

The research asked: Who can use today's narrow product? Which implemented controls need operational completion? What evidence would show business value? Which repair/reuse drivers are actually relevant? When would additional cloud capacity be justified?

Representative queries used:

1. `2026 site.itu.int Global E-waste Monitor 2024 62 million 22.3 reuse repair`
2. `2026 site.consilium.europa.eu right to repair directive laptops scope 2026`
3. `2026 site.nist.gov SP 800-88 Revision 2 sanitization reuse September 2025`
4. `2026 site.docs.github.com security harden deployments GitHub Actions self hosted runners`
5. `site.supabase.com/docs production checklist backup point in time recovery auth SMTP 2026`

Opened official ITU, European Commission JRC, Council of the EU, NIST, GitHub, Supabase and Nebius pages. Cross-checked the historical e-waste figures with JRC, the EU implementation date with EUR-Lex search results and the NIST revision/date with its publication PDF. EUR-Lex's consolidated page returned a JavaScript challenge on direct retrieval; the indexed official text corroborated the scope limitation. No commands, pricing table or production resource purchase is prescribed by this document.

## What the code and recorded integration establish

| Area | Present implementation / evidence | Gap that changes investment priority |
| --- | --- | --- |
| Identity and customer email | Supabase session validation, signup/recovery/code-entry flows, Google OAuth option and configurable custom OIDC option. [Auth guide](REVIEW-ENTERPRISE-AUTH.md), [client](../src/review-client.ts), [auth options](../lib/review/auth-options.ts). | No claim of verified external company email delivery. SMTP/provider setup remains an operational prerequisite. OIDC login does not enforce organization identity policy or provision/deprovision membership. |
| Tenant controls | Organization-scoped database policies, role checks, append-only evidence/audit protections, explicit worker authority and separate-person approval. [Schema](../supabase/migrations/20261010043058_sparecycle_review.sql), [latest mutation migration](../supabase/migrations/20261010060900_review_conflict_codes_and_lock_order.sql). | The public action contract has invite creation/redemption but no membership removal, role change, ownership transfer or invite revocation. Add lifecycle controls and adversarial tests before general company onboarding. [Action contract](../lib/review/request.ts). |
| Private repositories | Encrypted dispatch to a pinned verifier inside the same private repository, explicit organization/repository/installation binding, metadata-only proof and draft-only publication. A recorded real synthetic run reached a separately approved draft PR. [Setup and evidence](REVIEW-PRIVATE-REPOSITORIES.md). | Operator-maintained server bindings, repository key installation and workflow pinning are manual. Connection checks cannot read the repository secret. A successful real smoke test, rotation/revocation and guided setup remain necessary per customer. |
| Supported code | API accepts one `src/diagnostics/*.mjs` parser and up to four existing `tests/diagnostics/*.test.mjs` files. Static/runtime restrictions prohibit general imports, dependencies, I/O and arbitrary application builds. [Request](../lib/review/request.ts), [GitHub validation](../lib/review/github.ts), [harness](../lib/review/harness.ts). | This is a restricted diagnostic profile, not a general CodeRabbit replacement or arbitrary issue-to-PR agent. Broader languages and project builds need their own policy, isolation and evaluations. |
| Jobs and cancellation | Idempotent reservations, leases/checkpoints, continuation requests and conservative handling of uncertain external calls. Cancellation records intent and preserves in-use reservations. [Service](../lib/review/service.ts), [store](../lib/review/store.ts), [mutation migration](../supabase/migrations/20261010060900_review_conflict_codes_and_lock_order.sql). | No durable autonomous dispatcher/reconciler found. No job-cancellation path propagating a stop to an already-running provider/runner found. Request failure or user cancellation is not proof that remote work stopped. |
| Quotas and accounting | Monthly organization reservations, a shared service ceiling and active/daily job caps are enforced in the database. Model usage is bounded and priced through configured estimates. [Harness](../lib/review/harness.ts), [migration](../supabase/migrations/20261010060900_review_conflict_codes_and_lock_order.sql). | These controls are not an invoicing ledger or reconciled provider bill. The shared runtime ceiling is not a customer billing period. Need documented reset/reconciliation, fair scheduling and explicit spend policies. |
| Observability | Metadata-only LangSmith tracing, request identifiers and stored job/audit state provide a base. [Harness](../lib/review/harness.ts), [API](../api/review.ts). | No evidence of a staffed incident process, measured SLO, alert coverage, tenant support console or production restore drill in the inspected implementation. Model traces alone cannot establish availability or accuracy. |
| Hardware evidence | Passports bind manually supplied notes, logs and test results to versions; software/hardware/insufficient-evidence classifications control the next action. [Service](../lib/review/service.ts), [types](../lib/review/types.ts). | Evidence versioning proves which text was used, not that a physical device produced it. Need authentic collection, provenance, operator QA and sanitization evidence before physical release claims. |
| Workshop integration | Deterministic recovery planning with finite inventory/budgets, explicit search bounds, local company profiles and import/export. [Planner](../lib/recovery.ts), [workspace](../lib/workspace.ts), [UI persistence](../src/App.tsx). | Browser-local Workshop records are not shared Review organization inventory. Need stable asset identity, durable shared data and transactional reservations before multi-user workshop operation. |
| Outcome measurement | The README records synthetic planner comparisons and narrow integration evidence. [README](../README.md), [private pilot](REVIEW-PRIVATE-REPOSITORIES.md#recorded-private-pilot-verification). | No real customer cohort, independent technician baseline, accepted-fix economics or device-release dataset was established by this audit. Synthetic algorithm comparisons cannot substantiate commercial savings. |

The restricted profile is a useful launch boundary. Expanding it without new controls would remove part of the present assurance. A separate model review is a second assessment; correlated model mistakes remain possible, so unchanged tests and human accountability still matter.

## Repair and reuse: what primary sources support

**Waste is a meaningful problem, but not a market-size calculation.** The Global E-waste Monitor 2024 reports **62 million tonnes of global e-waste in 2022**, with **22.3% documented as formally collected and recycled**; the European Commission JRC repeats those figures. The year of the data is 2022, not 2026. These cover all e-waste and cannot be converted into SpareCycle laptop demand, revenue, recoverable devices or emissions saved. [ITU report](https://www.itu.int/pub/D-GEN-E_WASTE.01-2024), [report PDF](https://www.itu.int/dms_pub/itu-d/opb/gen/D-GEN-E_WASTE.01-2024-PDF-E.pdf), [JRC summary](https://rmis.jrc.ec.europa.eu/ewaste).

**European repair policy is directional support, not a blanket laptop mandate.** The Council describes the right-to-repair directive and a national transposition deadline of **31 July 2026**. The directive limits the relevant repair obligations to goods covered by repairability requirements in the listed Union acts. Customer jurisdiction, product category and national implementation must be checked before a regulatory claim. This research does not establish that every laptop or B2B refurbishment transaction is covered. [Council policy explanation](https://www.consilium.europa.eu/en/policies/right-to-repair-products/), [official directive](https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A32024L1799).

**Safe reuse requires evidence beyond a software patch.** NIST SP 800-88 Revision 2 was finalized in September 2025 and addresses an organizational media-sanitization program based on information sensitivity and appropriate controls. Product implication: integrate authentic outputs of the customer's approved sanitization process and preserve accountable release review. Generated text cannot verify that a wipe happened; adoption of a standard is not product certification. [NIST publication](https://csrc.nist.gov/pubs/sp/800/88/r2/final), [publication PDF](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-88r2.pdf).

## Production infrastructure: implications, not automatic purchases

**Customer email:** Supabase describes its default SMTP service as intended for non-production use, with recipient restrictions. A customer-approved sending service, deliverability monitoring and real confirmation/recovery tests are required before opening email-based company onboarding. This is an operational dependency even though the forms and templates exist. [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

**Identity:** Supabase supports custom OAuth/OIDC providers; its project SAML SSO is a separate capability with plan requirements. Neither a Google button nor successful custom OIDC login alone proves organization SSO enforcement, automatic membership, SCIM or immediate user revocation. Select the IdP path with an actual buyer and verify server-side organization policy. [Custom providers](https://supabase.com/docs/guides/auth/custom-oauth-providers), [SAML SSO](https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml).

**Recovery and service operations:** Supabase's production checklist covers security configuration, load, availability and abuse prevention. Its backup guide distinguishes plan-dependent backup facilities, recommends independent exports for free-tier projects, and notes that database backups exclude Storage object contents. Fund a tested recovery procedure spanning all stored data and configuration. A configured backup is not a measured restore objective. [Production checklist](https://supabase.com/docs/guides/deployment/going-into-prod), [backup guide](https://supabase.com/docs/guides/platform/backups).

**Untrusted code:** GitHub advises least-privilege workflow credentials, immutable action references, scrutiny of logs/secrets and careful handling of untrusted execution. It distinguishes clean GitHub-hosted execution from the persistence risks of self-hosted runners. SpareCycle's private pilot uses a GitHub-hosted workflow and restricted containers; “private repository” does not mean a persistent self-hosted runner. Broader execution needs a new threat model rather than assuming the current bounded profile covers it. [GitHub secure-use reference](https://docs.github.com/en/actions/reference/security/secure-use).

**Nebius capacity:** Public Token Factory endpoints use shared infrastructure and per-token charging; processing region can change. Dedicated endpoints offer configured regional capacity and GPU-hour charging. Invest only after workload measurements or customer residency requirements justify the capacity decision. Nebius's documented endpoint observability is currently for dedicated endpoints and is not a billing reconciliation system; SpareCycle still needs its own end-to-end measurements. [Endpoint comparison](https://docs.tokenfactory.nebius.com/ai-models-inference/dedicated-endpoints/overview), [observability](https://docs.tokenfactory.nebius.com/ai-models-inference/observability).

## What remains unverified

- The number of target operators maintaining compatible diagnostic code, frequency of relevant defects, willingness to pay and procurement duration.
- Any market TAM, customer count, revenue forecast, achieved savings, real device recovery uplift or verified carbon reduction.
- Delivery of actual signup/recovery emails to external company domains and enforceable customer IdP policy in this deployment.
- Customer-specific private runner quotas, secret correctness, region requirements, contracts and subprocessor acceptance. The synthetic pilot does not verify another company's setup.
- Authenticity of manual hardware evidence, safe physical repair, erasure completion and workshop release QA.
- Independent penetration testing, certification, production availability, disaster recovery objectives or general-language execution safety.
- Complete local legal applicability. EU product scope and national implementation require jurisdiction-specific verification; an app “passport” is not automatically a regulated digital product passport.

## Sources

All links below were obtained from official source pages or indexed official results and reviewed on 11 October 2026. The claims above link to their relevant source; these entries provide a compact bibliography.

1. ITU/UNITAR, [Global E-waste Monitor 2024](https://www.itu.int/pub/D-GEN-E_WASTE.01-2024).
2. European Commission JRC, [E-waste](https://rmis.jrc.ec.europa.eu/ewaste).
3. Council of the EU, [Right to repair products](https://www.consilium.europa.eu/en/policies/right-to-repair-products/).
4. EUR-Lex, [Directive (EU) 2024/1799](https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A32024L1799).
5. NIST, [SP 800-88 Rev. 2](https://csrc.nist.gov/pubs/sp/800/88/r2/final).
6. Supabase, [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [custom providers](https://supabase.com/docs/guides/auth/custom-oauth-providers), [project SAML](https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml).
7. Supabase, [production checklist](https://supabase.com/docs/guides/deployment/going-into-prod), [database backups](https://supabase.com/docs/guides/platform/backups).
8. GitHub, [secure-use reference](https://docs.github.com/en/actions/reference/security/secure-use).
9. Nebius Token Factory, [dedicated endpoint comparison](https://docs.tokenfactory.nebius.com/ai-models-inference/dedicated-endpoints/overview), [observability](https://docs.tokenfactory.nebius.com/ai-models-inference/observability).
