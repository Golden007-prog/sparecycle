# SpareCycle release record

Recorded 10 October 2026. SpareCycle is a working browser-local pilot prototype. It is not a shared enterprise service, and the 520-story roadmap is not a claim that all features are implemented.

## Verified company prototype release

| Evidence | Observation |
| --- | --- |
| Public source | [Golden007-prog/sparecycle](https://github.com/Golden007-prog/sparecycle) |
| Company runtime commit | `0a28d2b` |
| Live site | [sparecycle-topaz.vercel.app](https://sparecycle-topaz.vercel.app) |
| Company deployment | `dpl_9nirUUvw9qafyiXsCnXdoQaJFH7P` |
| Automated verification | 56 tests passed; TypeScript and production build passed locally, in the delivery folder and on Vercel |
| GitHub verification | [Successful run](https://github.com/Golden007-prog/sparecycle/actions/runs/38020705745) on the runtime commit |
| Credential exclusion | Source/build scan found no private credential values or forbidden tracked paths |
| Company browser flow | Three-step setup, named batch copies, independent limits, reload persistence, CSV import, cross-company review clearing and non-overwriting backup restoration verified locally |
| Public browser smoke | Updated UI and setup dialog opened; CSV template import returned one proposal and one held device |
| Live AI provider | NVIDIA `nvidia/Nemotron-3_5-Lightning` through **Nebius Token Factory** |
| New company-release model result | 4.1 seconds; inventory and planning tools completed; seven proposals vs five baseline, $25, 150 minutes |
| Observability | LangSmith metadata tracing; prior delivered root/tool records inspected with empty inputs and outputs. The latest returned correlation ID alone is not a new trace-content inspection. |
| Kaggle reference | 291 retained historical listing variants; source hash, quality exclusions and reproduction check recorded |
| Capability roadmap | 520 stories; 216 differentiation candidates; 29 shipped-story flags and 491 planned flags; generated public catalog matches source |
| Requested local delivery | `E:\LOCAL helper\sparecycle`; existing user batch template and private settings preserved |

See [VALIDATION.md](VALIDATION.md) for the evidence, narrow-screen measurements and exact boundaries of the browser checks.

## Pilot use

Start with the [company quickstart](COMPANY-QUICKSTART.md): create a company workspace, import reviewed device/part CSV files, then inspect the proposal and export draft work orders. Use one coordinator, one active editing tab, and a small non-sensitive batch. Keep workspace exports as backups. Restoring a backup creates separate company copies rather than overwriting existing valid records.

A declared hold is incompatible with eligibility. The allocator excludes unverified parts and never infers exact part approval from the Kaggle catalog. Technician inspection, repairs, sanitization evidence and final QA remain separate physical responsibilities.

## Remaining production and submission work

- Authenticated company accounts, server-enforced tenant separation, concurrent stock reservations, durable audit records and shared quotas are planned.
- Browser storage is not a server backup. Simultaneous editing across tabs is not coordinated.
- Broad load/security/accessibility audits and customer acceptance testing remain future work. Reported synthetic outcomes are not customer gains.
- Browser file-picker automation was blocked by the extension's file-URL permission. Pasted CSV and backup flows were verified; file-picker behavior is not claimed as an observed test.
- The public YouTube demo and Devpost submission remain unfinished. Deployment and source publication are not submission.
- Keep the demo available to judges for the required period after entering.

## Deployment integration

Vercel production deployment is manual. Automatic GitHub-to-Vercel deployment is not connected because the account requires a GitHub Login Connection. GitHub verification runs on pushes; it does not deploy the site. No paid account upgrade or credit purchase was made.
