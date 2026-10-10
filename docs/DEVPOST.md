# SpareCycle: Devpost submission draft

Editorial draft for the published company-workspace runtime `0a28d2b`. The release has passed its automated suite, production builds and local workflow checks; the deployed company interface and a fresh live agent review also succeeded. Keep claims aligned with the detailed release evidence. The video and Devpost entry remain unsubmitted.

## Submission fields

- **Name:** SpareCycle
- **Tagline:** Turn a pile of repairable laptops into a plan for the whole workshop.
- **Track:** Best Apps and Agents
- **Live application:** https://sparecycle-topaz.vercel.app
- **Public source:** https://github.com/Golden007-prog/sparecycle — company-workspace runtime `0a28d2b` published on main.
- **Public YouTube video:** remaining submission task
- **Built with:** React, Vite, TypeScript, Vercel, NVIDIA Nemotron, Nebius Token Factory, optional LangSmith

## Inspiration

A donated laptop can be one component away from useful. Across a workshop, several devices may compete for the same tested part and the same technician shift.

Reuse organizations already salvage usable components from unsuitable computers. [PCs for People describes this practice](https://www.pcsforpeople.org/faqs/). Repair systems also manage stock, donor parts, and individual repair decisions. We focused on the decision between those records: which combination of complete repairs should the workshop attempt today?

SpareCycle makes that trade-off visible and reviewable. It is designed for coordinators turning limited parts and labor into the next useful batch of computers.

## What it does

A coordinator completes three-step setup for a local company profile, then imports Devices and Parts CSV files, imports a JSON batch, or opens the synthetic example. Each browser can hold up to eight company profiles with 20 saved batches per profile. Named batches keep their own limits and autosave locally. The coordinator reviews diagnosed needs and declared compatibility before planning.

SpareCycle allocates eligible parts across complete repair candidates. Its workshop schematic shows component sources and device outcomes, while device inspection provides the exact allocations and evidence. The coordinator can compare a transparent baseline with the optimized plan, inspect rejected assignments, and see what remains blocked.

When a donor component fails, one change triggers a new plan. JSON evidence packets and CSV work orders carry allocations and outstanding checks forward.

A model catalog adds 291 historical laptop listing variants from a Kaggle dataset whose uploader declares CC0-1.0. It helps staff compare source names and specifications. These are third-party retailer claims with historical INR prices, not manufacturer-approved compatibility records or current resale values. The [source and quality report](DATA-SOURCES.md) records exclusions, provenance and limitations.

Workspace backups can be validated and restored as separate company profiles with new identifiers, preserving existing local records. The company profiles organize one browser's work; they are not authenticated, shared company accounts.

The demonstration's diagnostic records, compatibility declarations, costs and outcome counts are synthetic. A planned repair is not a computer already fixed or delivered. Final QA, data-wipe evidence, supported-software policy, and technician review remain separate release requirements.

## How we built it

React, Vite, and TypeScript provide the workshop interface. A deterministic allocator enforces compatibility, stock conservation, donor availability, and the active resource limits. The comparison uses the same inputs and constraints for each plan.

NVIDIA Nemotron is integrated through Nebius Token Factory. It structures supplied notes into drafts for review and explains calculated results. Its bounded tools are list_inventory, inspect_device, and compute_recovery_plan. The model reads known records and invokes the planner; it cannot invent compatibility, diagnose hardware, or override an allocation constraint.

Vercel hosts the frontend and server routes. Company profiles, saved batches, CSV/JSON imports and backup restoration use validated local browser state. Optional LangSmith tracing records operational metadata while hiding inventory text and generated content. Supabase is not used; authenticated shared persistence remains future work.

## Challenges

The hardest problem is not producing a fluent recommendation. It is preserving the facts that make the recommendation usable.

Every selected candidate needs all required components. A scarce part cannot serve two devices. Unknown compatibility must remain blocked. A donor failure must invalidate dependent assignments. Limits must constrain both the baseline and optimized plan.

We also distinguish modeled repair completion from release readiness. A solver cannot inspect a laptop or certify that its data has been erased.

## Accomplishments we are proud of

The implementation combines company setup and batch preparation with evidence review, constrained allocation, baseline comparison, failure replay, and reviewable work orders. Company setup, saved-batch isolation, CSV import, catalog search and safe backup restoration were exercised in local browser checks; the published company interface loaded successfully.

The company release passed 56 automated tests: 24 API, 11 domain, 3 export, 7 CSV and 11 workspace tests. Domain checks include an independent brute-force oracle over 24 small fixtures. Production builds and [GitHub CI](https://github.com/Golden007-prog/sparecycle/actions/runs/38020705745) passed. In the fixed synthetic demonstration, a $25 purchase budget and 180-minute shift allow seven projected complete repairs versus five for the intake-order baseline. Removing one donor-RAM component changes the plan to six, also confirmed in the earlier browser checks. These results describe the supplied synthetic records; they are not actual devices repaired or evidence of customer improvement.

The central technical claim is testable: allocations must satisfy the supplied rules. The AI has useful bounded tools, while deterministic code owns resource decisions and unresolved facts remain visible.

## What we learned

Existing refurbishment platforms already do substantial work in harvesting, stock management, repair routing, and AI-assisted diagnosis. The useful contribution has to be specific.

Whole-batch decisions are different from a sequence of individually attractive repairs. Showing the trade-off, the constraint, and the consequence of a failure is more useful than presenting a recommendation without its evidence.

## What's next

We want to evaluate de-identified batches with coordinators and technicians. The first pilot should measure input-preparation time, review time, plan corrections, and actual completed releases under matched constraints.

A team version would need shared inventory, authenticated roles, reservation handling, audit history, reliable imports, and durable usage quotas. Regional refurbishers and managed school-IT providers are buyer hypotheses. No customers, revenue, measured operational improvement, or competitive exclusivity are claimed.

The [interactive roadmap](https://sparecycle-topaz.vercel.app/roadmap.html) and [feature catalog](FEATURES.md) organize 520 workflow stories, including 216 MVP candidates. The catalog currently marks 29 stories shipped and 491 planned; these are story classifications, not counts of distinct UI controls. Company features awaiting acceptance remain planned. The [company quickstart](COMPANY-QUICKSTART.md) and [adoption guide](COMPANY-ADOPTION.md) define a small coordinator-led pilot, rather than claiming the full roadmap is implemented.

## Integration and release evidence

- Exact successful deployed NVIDIA model ID: **nvidia/Nemotron-3_5-Lightning**.
- Real deployed intake: **succeeded in 9.35 seconds**.
- Fresh company-release batch-agent completion: **succeeded in 4.1 seconds**, executing list_inventory and compute_recovery_plan. The returned plan had seven projected candidates versus a five-candidate baseline, $25 cost and 150 technician minutes. An earlier baseline review succeeded in 2.8 seconds.
- LangSmith: an **earlier successful plan root and inventory/planning children were inspected with empty inputs/outputs** in the sparecycle project. That trace records 2.49 seconds of server execution. The fresh request returned `fcdf679d-8ea7-44fc-9582-a8fcfccf0915`; its trace contents have not been reinspected.
- Tests/build: **56 tests passed; production builds and GitHub CI passed**. Local browser checks covered setup, saved-batch isolation, persistence, CSV holds, review reset, safe backup restore, catalog and roadmap filters, and mobile navigation at 355 CSS pixels without horizontal overflow.
- Public application: the **published company interface loaded and setup opened** at https://sparecycle-topaz.vercel.app. The full company workflow checks above were local; the new deployed smoke check also included the successful live agent request.
- Public source: company runtime **`0a28d2b` published on main** at https://github.com/Golden007-prog/sparecycle; Vercel deployment `dpl_9nirUUvw9qafyiXsCnXdoQaJFH7P`.
- Public YouTube recording: **remaining submission task**.

Detailed observations and remaining checks are in [VALIDATION.md](VALIDATION.md). The public YouTube video and final entrant submission review remain before treating the entry as submission-ready. Deployment and source publication do not themselves submit the project to Devpost.

The official FAQ permits a web app hosted elsewhere when it uses the required NVIDIA model through Nebius Token Factory. [Platform clarification](https://nebiusglobalaihackathon.devpost.com/details/faqs).

Do not claim use of Nebius AI Cloud, Serverless Jobs, Tavily, Supabase, local NVIDIA hardware, model fine-tuning, or a completed pilot unless actually added and verified.

## Platform feedback

On 10 October 2026, a production intake request to nvidia/Nemotron-3_5-Lightning through Nebius succeeded in 9.35 seconds. A complete batch-agent review succeeded in 2.8 seconds and executed both inventory and planning tools. Its delivered LangSmith root and tool records were inspected with empty inputs/outputs. The final completion reported 356 completion tokens, zero reasoning tokens, and a stop finish reason. Integration testing showed that reasoning settings and bounded tool-loop termination matter for concise structured responses. These are individual smoke observations, not a latency, cost, or reliability benchmark. The deterministic plan remains authoritative when reviewing generated explanations.

After publishing the company-workspace runtime, another deployed review succeeded in 4.1 seconds and reproduced the seven-versus-five plan using actual inventory and planning tools. This confirms a fresh successful integration request, not a general performance guarantee; its newly returned trace ID has not had a second privacy-content inspection.

## Eligibility and submission checklist

- [ ] Confirm entrant eligibility and accept the official rules.
- [ ] Select Best Apps and Agents and verify required NVIDIA Nemotron usage on Nebius.
- [ ] Reconcile this draft with the shipped feature set and final evaluation results.
- [ ] Add the live URL and confirm anonymous judge access.
- [ ] Publish source with the MIT license, setup instructions, and necessary assets.
- [ ] Upload a **public YouTube video of no more than three minutes** showing the working product and required integration.
- [ ] Include project description, test instructions, and genuine platform feedback.
- [ ] Provide English material or English translations.
- [ ] Submit by **30 October 2026, 10:30 p.m. IST** (10 a.m. PDT).
- [ ] Keep access free to judges through **15 December 2026**.

Recheck the [official rules](https://nebiusglobalaihackathon.devpost.com/rules), [submission page](https://nebiusglobalaihackathon.devpost.com/), and FAQ before submitting. No outcome is guaranteed.
