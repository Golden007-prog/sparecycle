# SpareCycle

**Choose the repair batch that gets more laptops ready for their next owner.**

SpareCycle is a planning desk for laptop refurbishing coordinators. It combines diagnosed device needs, tested spare parts, approved donor devices, declared exact-SKU compatibility, and a fixed workshop budget. Its deterministic allocator proposes a batch of repairs, explains blocked alternatives, and recalculates when a donor part fails.

Built for the **Best Apps and Agents** track of the Nebius x NVIDIA Global AI Hackathon.

- Live application: [sparecycle-topaz.vercel.app](https://sparecycle-topaz.vercel.app)
- Public source: [Golden007-prog/sparecycle](https://github.com/Golden007-prog/sparecycle) — the previous baseline is published on main; the company-workspace expansion is awaiting final publication and deployment verification.
- Public YouTube demonstration: **remaining submission task**
- License: [MIT](LICENSE)
- Release evidence: the previous baseline passed automated tests and a production build, and the public manual planner loaded anonymously. Final checks for the expanded company, import, catalog, and backup flows are tracked in [VALIDATION.md](docs/VALIDATION.md).
- Live NVIDIA intake succeeded in **9.35 seconds** and a complete batch-agent review in **2.8 seconds**, with actual inventory and planning tools. The successful LangSmith plan trace and tool records were inspected with empty inputs/outputs. See [validation evidence](docs/VALIDATION.md).

![SpareCycle workshop bench](docs/assets/sparecycle-desktop.jpg)

Actual browser capture of the earlier synthetic workshop baseline. A [mobile capture](docs/assets/sparecycle-mobile.jpg) is also included. These captures do not verify the expanded company-workspace flows.

## The workshop workflow

1. Create a browser-local company profile through three-step setup: workshop details, default planning limits, and the first batch. The prototype supports up to eight profiles and 20 saved batches per profile.
2. Open the clearly labeled synthetic batch, or import workshop records using the Devices and Parts CSV templates or the JSON batch template. Name and save separate batches; changes to a selected saved batch autosave locally.
3. Review diagnosed needs, stock, approved donor parts, compatibility evidence, labor estimates, and release requirements.
4. Set technician-time and purchase-budget limits, then compare baseline and optimized allocations under the same constraints.
5. Inspect exact allocations and blocked candidates. Mark a donor component unavailable to replay a failure and generate a revised plan.
6. Review and export the report and work orders. Record physical work and final checks separately.
7. Export a workspace backup before removing records or clearing storage. Restoration validates the backup and adds separate restored company profiles with new identifiers, preserving existing profiles and batches. The same workspace limits apply.

The central trade-off is across devices: using a scarce part on the first repair can prevent a more useful combination of repairs. The interface makes each allocation and the remaining constraints inspectable.

The main bench is a schematic overview of part sources and device outcomes. Open a device to inspect its exact component allocations and evidence; the central spine does not draw every source-to-recipient connection.

Batch import accepts two CSV files (Devices and Parts) or a JSON batch. Work orders export as CSV, and evidence packets export as JSON. Report exports, batch templates, and complete workspace backups have different schemas and restore/import flows. Review and edit AI intake drafts before constructing a batch. See the [company quickstart](docs/COMPANY-QUICKSTART.md) for field constraints and the [company adoption guide](docs/COMPANY-ADOPTION.md) for a pilot workflow.

**The sample inventory, diagnostic records, compatibility declarations, costs, and outcomes are synthetic.** A sample record marked verified means the fictional scenario declares that evidence; it is not manufacturer verification or certification. Plans predict what could be repaired under supplied assumptions. They do not prove that any physical device has been repaired, wiped, tested, or delivered.

## Architecture

~~~text
React + Vite + TypeScript workshop interface
  |-- Browser-local inventory, scenarios, and review state
  |-- Company profiles, named batches, CSV/JSON import, and workspace backups
  |-- Historical laptop reference catalog
  |-- Deterministic constrained batch allocator
  `-- Vercel /api/analyze (server only)
        |-- NVIDIA Nemotron through Nebius Token Factory
        |-- list_inventory / inspect_device / compute_recovery_plan
        `-- Optional LangSmith operational metadata
~~~

Nemotron turns supplied notes into a draft for coordinator review and explains tool results. It does not diagnose hardware from symptoms, create compatibility facts, certify erasure, or execute repairs. The tools read the supplied inventory and invoke deterministic planning; the model does not override resource constraints.

Company profiles and saved batches remain in one browser. They organize records but do not create authenticated company accounts, tenant isolation on a server, or synchronization between teammates. Supabase is not used. Shared inventory, permissions, audit history, and concurrent stock reservations belong to a future team version.

## Reference data and product roadmap

The model catalog contains **291 historical laptop listing variants across 14 brands**, derived from a Kaggle dataset whose uploader declares **CC0-1.0**. Its last update was February 2023. The importer excluded incomplete or malformed rows and retained source-row references. Specifications remain unverified retailer claims; historical INR prices are not current offers or the planner's USD repair costs. Catalog matches never approve a replacement part, diagnosis, condition, or release. See [data sources and reproducible filtering](docs/DATA-SOURCES.md).

The [interactive roadmap](https://sparecycle-topaz.vercel.app/roadmap.html) is built from `public/roadmap.html` and the [feature catalog](docs/FEATURES.md). The current catalog contains **520 workflow stories**, including **216 MVP candidates**; **29 stories are currently marked shipped and 491 planned**. These are product-planning records, not a count of distinct implemented screens or buttons. Company capabilities awaiting catalog acceptance remain planned. The roadmap is not a promise that the full product exists, and its updated deployment is part of the current release checks.

## Run locally

Use **Node.js 22 LTS** and npm.

~~~sh
npm install
~~~

Copy the environment template:

~~~powershell
# Windows PowerShell
Copy-Item .env.example .env.local
~~~

~~~sh
# macOS / Linux
cp .env.example .env.local
~~~

Add server credentials to .env.local, then start the app:

~~~sh
npm run dev
~~~

Open the address printed by the server, normally http://localhost:3000. The development server loads .env.local and serves both the interface and API. Manual records and deterministic planning do not require an AI key. An unavailable provider must produce an explicit error, not a sample answer presented as live AI.

~~~sh
npm test
npm run build
~~~

These are reproduction commands, not a claim that release checks have passed. The build checks TypeScript and produces the Vite frontend. The preview command serves the frontend only; use the development server or Vercel for API features.

## Configuration

| Server variable | Purpose |
| --- | --- |
| NEBIUS_API_KEY | Required for live Nemotron calls. |
| NEBIUS_MODEL | Default: nvidia/Nemotron-3_5-Lightning; verified in the earlier deployed intake and planning smoke checks. |
| LANGSMITH_API_KEY | Optional tracing credential. |
| LANGSMITH_PROJECT | Use sparecycle for a dedicated trace project. |
| LANGSMITH_WORKSPACE_ID | Actual workspace UUID when required by the key. The organization ID in a LangSmith /o/ URL is not a workspace ID. |
| LANGSMITH_ENDPOINT | Usually https://api.smith.langchain.com; use the endpoint appropriate to your workspace. |
| LANGSMITH_TRACING | Set to false to disable optional tracing. |
| APP_ORIGIN | Optional canonical deployed browser origin. |
| PORT | Local port; defaults to 3000. |

Requests use https://api.tokenfactory.nebius.com/v1/. The OpenAI SDK is the compatibility client; **Nebius serves the NVIDIA model**. [Nebius quickstart](https://docs.tokenfactory.nebius.com/quickstart) and [API reference](https://api.tokenfactory.nebius.com/docs).

Keep keys on the server. Never commit .env.local or expose credentials with a VITE_ prefix. Configuration flags indicate presence of settings, not proof of inference or trace delivery.

## Allocator and baseline

The allocator jointly searches device subsets and part assignments. Its objective, in order, is to maximize complete repair candidates, maximize their summed priority, minimize incremental cash, and minimize technician time. The search is capped at 200,000 states; a capped result reports that optimality is unproven.

The supported planning size is at most 18 devices, 40 part rows, and six needed component units per device. Only exact-SKU relationships with declared verified availability and evidence references are eligible. Dedicated donor records are inventory sources and cannot also be repair candidates. Technician time includes per-device repair time and per-unit harvest/preparation time.

The baseline processes devices in intake order and greedily prefers lower-cash, then lower-preparation-time parts under the same constraints. It is an algorithmic comparison, not a measured representation of human performance.

## Recorded domain verification

On 10 October 2026, the targeted recovery test suite passed, including an independent brute-force comparison across **24 varied small batches** and a capped-search feasibility check:

~~~sh
npx tsx --test tests/recovery.test.ts
~~~

For the fixed synthetic fixture with a $25 purchase budget and 180 technician minutes:

| Result | Intake-order baseline | Allocator |
| --- | --- | --- |
| Projected complete repair candidates | 5 | 7 |
| Incremental cash | $25 | $25 |
| Planned technician time | 160 minutes | 150 minutes |

Making part-t480-ram-donor unavailable reduces the allocator's result to six projected candidates. These are reproducible modeled outcomes, not physical repairs or measured customer gains.

The earlier baseline passed its automated suite and production build. Browser checks on that baseline confirmed the default seven-candidate plan, the six-candidate donor-failure result, identity-hold inspection, invalid-import rejection, and a valid one-device JSON import followed by restoring the demo. New company/workspace, CSV, catalog and recovery checks extend that scope; their final test totals and browser/deployment evidence belong in [VALIDATION.md](docs/VALIDATION.md), not in an assumed carry-forward result.

At 390-pixel mobile width, no horizontal overflow was observed. Closed navigation is hidden from the accessibility tree; opening it focuses Recovery planner, Escape restores the navigation toggle, and page selection moves focus to the main content. Anonymous HTML access returned HTTP 200 and the manual planner loaded. A complete live batch-agent review executed list_inventory and compute_recovery_plan and returned seven projected candidates, a five-candidate baseline, $25 cost, and 150 technician minutes. These are individual smoke checks; details and remaining coverage are in [VALIDATION.md](docs/VALIDATION.md).

## Planning and evidence rules

- Compatibility is an explicit approved relationship between exact device and part SKUs, with provenance. Unknown or unsupported relationships are blocked. Similar names, connectors, or dimensions are insufficient.
- Only components declared tested and available can be allocated. Quantities cannot be double-used. Donor availability and any donor/recipient restrictions must be enforced.
- A complete repair candidate needs all required components and must fit the active time and budget constraints.
- The plan describes its objective and search status. A bounded or incomplete search must not be labeled globally optimal.
- Baseline and optimized plans use the same supplied facts and constraints. A positive difference on one synthetic scenario is not measured customer improvement.
- Planned recovery is separate from release readiness. Final QA, data-wipe evidence, supported operating-system policy, and technician review remain necessary before release.
- Estimates can be wrong. Unexpected faults, damaged donors, inaccurate labor estimates, and stale stock require reassessment.

## Deployment and verification

The earlier baseline is deployed at [sparecycle-topaz.vercel.app](https://sparecycle-topaz.vercel.app). Real intake and complete batch-agent requests succeeded using NVIDIA nvidia/Nemotron-3_5-Lightning through Nebius. LangSmith intake, successful plan, and tool records were delivered and inspected with empty inputs/outputs. The company-workspace expansion requires its own final publication, deployment and browser verification; those earlier observations do not establish that the new flows have passed.

The current release uses manual Vercel deployments. Automatic deployment from GitHub is not connected: Vercel's Git connection requires a GitHub Login Connection on the account. Public source and the manual production deployment work independently. For another deployment, apply server environment variables and verify anonymous access, tool execution, errors, imports, and exports.

The API bounds payloads, tool execution, output, and request duration. In-memory throttles operate per server instance: restarts and horizontal scaling reset or multiply them. They are not a durable account-wide spend cap. A production service needs authenticated access, shared quotas, and provider budget controls.

## Data and privacy

Browser storage is not an encrypted vault, a team database, or a reliable backup. Export records you need to keep, and use synthetic information in the public demo.

AI requests send supplied notes and relevant workshop context through the server to Nebius. Local storage does not mean on-device inference. Never submit customer files, passwords, device contents, or unnecessary personal information.

Optional LangSmith tracing is designed to retain action/model/status, tool names, and aggregate counts while hiding input and output content. Verify actual trace contents before sharing them. [LangSmith privacy controls](https://docs.langchain.com/langsmith/mask-inputs-outputs).

The app does not erase disks, alter hardware, purchase parts, submit external messages, or certify a device. Work orders are drafts for qualified staff. External manufacturer instructions and organizational policies remain authoritative.

## Research and submission materials

- [Need, competitors, and winner-inspired mechanisms](docs/RESEARCH.md)
- [Business hypotheses and validation](docs/BUSINESS.md)
- [Company quickstart and CSV preparation](docs/COMPANY-QUICKSTART.md)
- [Company adoption and pilot scope](docs/COMPANY-ADOPTION.md)
- [Kaggle source, quality report and limitations](docs/DATA-SOURCES.md)
- [Feature catalog and roadmap status](docs/FEATURES.md)
- [Devpost draft and eligibility checklist](docs/DEVPOST.md)
- [Three-minute demo script](docs/DEMO-SCRIPT.md)
- [Delivery plan](docs/PLAN.md)
- [Workshop interface design](docs/DESIGN.md)
- [Release-readiness checklist](docs/RELEASE.md)
- [Recorded validation evidence](docs/VALIDATION.md)

Existing products already manage repairs, harvest components, and route devices. SpareCycle's proposed contribution is inspectable **whole-batch allocation under scarce parts and workshop constraints**, with failure replay and explicit evidence gaps. Competitive exclusivity and customer demand have not been established.
