# SpareCycle: Devpost submission draft

Editorial draft for the completed implementation. Reconcile every feature with the final app and replace verification placeholders before submitting. Publishing source or deploying the app does not submit a Devpost entry.

## Submission fields

- **Name:** SpareCycle
- **Tagline:** Turn a pile of repairable laptops into a plan for the whole workshop.
- **Track:** Best Apps and Agents
- **Live application:** https://sparecycle-topaz.vercel.app
- **Public repository:** https://github.com/Golden007-prog/sparecycle — repository created; source push pending.
- **Public YouTube video:** remaining submission task
- **Built with:** React, Vite, TypeScript, Vercel, NVIDIA Nemotron, Nebius Token Factory, optional LangSmith

## Inspiration

A donated laptop can be one component away from useful. Across a workshop, several devices may compete for the same tested part and the same technician shift.

Reuse organizations already salvage usable components from unsuitable computers. [PCs for People describes this practice](https://www.pcsforpeople.org/faqs/). Repair systems also manage stock, donor parts, and individual repair decisions. We focused on the decision between those records: which combination of complete repairs should the workshop attempt today?

SpareCycle makes that trade-off visible and reviewable. It is designed for coordinators turning limited parts and labor into the next useful batch of computers.

## What it does

A coordinator imports a JSON batch or opens the synthetic example, reviews diagnosed needs and declared compatibility, then sets time and budget limits.

SpareCycle allocates eligible parts across complete repair candidates. Its workshop schematic shows component sources and device outcomes, while device inspection provides the exact allocations and evidence. The coordinator can compare a transparent baseline with the optimized plan, inspect rejected assignments, and see what remains blocked.

When a donor component fails, one change triggers a new plan. JSON evidence packets and CSV work orders carry allocations and outstanding checks forward.

All demonstration records and outcome counts are synthetic. A planned repair is not a computer already fixed or delivered. Final QA, data-wipe evidence, supported-software policy, and technician review remain separate release requirements.

## How we built it

React, Vite, and TypeScript provide the workshop interface. A deterministic allocator enforces compatibility, stock conservation, donor availability, and the active resource limits. The comparison uses the same inputs and constraints for each plan.

NVIDIA Nemotron is integrated through Nebius Token Factory. It structures supplied notes into drafts for review and explains calculated results. Its bounded tools are list_inventory, inspect_device, and compute_recovery_plan. The model reads known records and invokes the planner; it cannot invent compatibility, diagnose hardware, or override an allocation constraint.

Vercel hosts the frontend and server routes. The single-workshop prototype uses local browser state. Optional LangSmith tracing records operational metadata while hiding inventory text and generated content. Supabase is unnecessary for this scope; shared team persistence remains future work.

## Challenges

The hardest problem is not producing a fluent recommendation. It is preserving the facts that make the recommendation usable.

Every selected candidate needs all required components. A scarce part cannot serve two devices. Unknown compatibility must remain blocked. A donor failure must invalidate dependent assignments. Limits must constrain both the baseline and optimized plan.

We also distinguish modeled repair completion from release readiness. A solver cannot inspect a laptop or certify that its data has been erased.

## Accomplishments we are proud of

The intended completed entry combines one coherent workflow: evidence review, constrained allocation, baseline comparison, failure replay, and reviewable work orders.

The complete current suite passes 37 tests: 23 API, 11 domain, and 3 export tests. Domain tests include an independent brute-force oracle over 24 small fixtures, and the production build passes. In the fixed synthetic demonstration, a $25 purchase budget and 180-minute shift allow seven projected complete repairs versus five for the intake-order baseline. Removing one donor-RAM component changes the plan to six, also confirmed in the browser. These results describe the supplied synthetic records; they are not actual devices repaired or evidence of customer improvement.

The central technical claim is testable: allocations must satisfy the supplied rules. The AI has useful bounded tools, while deterministic code owns resource decisions and unresolved facts remain visible.

## What we learned

Existing refurbishment platforms already do substantial work in harvesting, stock management, repair routing, and AI-assisted diagnosis. The useful contribution has to be specific.

Whole-batch decisions are different from a sequence of individually attractive repairs. Showing the trade-off, the constraint, and the consequence of a failure is more useful than presenting a recommendation without its evidence.

## What's next

We want to evaluate de-identified batches with coordinators and technicians. The first pilot should measure input-preparation time, review time, plan corrections, and actual completed releases under matched constraints.

A team version would need shared inventory, authenticated roles, reservation handling, audit history, reliable imports, and durable usage quotas. Regional refurbishers and managed school-IT providers are buyer hypotheses. No customers, revenue, measured operational improvement, or competitive exclusivity are claimed.

## Integration and release evidence

- Exact successful deployed NVIDIA model ID: **nvidia/Nemotron-3_5-Lightning**.
- Real deployed intake: **succeeded in 9.35 seconds**.
- Full batch-agent completion: **pending verification after a tool-loop fix**. An earlier incomplete request executed list_inventory and compute_recovery_plan, but is not counted as a successful completed review.
- LangSmith: **delivered intake and planner-tool records inspected with empty inputs/outputs** in the sparecycle project. Full successful agent-run inspection remains pending.
- Tests/build: **37 tests passed; production build passed**. Browser checks confirmed default planning, donor failure, identity-hold inspection, and invalid-import rejection.
- Public application: **anonymous HTML HTTP 200 and manual planner loaded** at https://sparecycle-topaz.vercel.app.
- Public repository: **created; source push pending** at https://github.com/Golden007-prog/sparecycle.
- Public YouTube recording: **remaining submission task**.

Detailed observations and pending checks are in [VALIDATION.md](VALIDATION.md). Source publication, full batch-agent verification, the public video, and final submission review remain before treating the entry as submission-ready.

The official FAQ permits a web app hosted elsewhere when it uses the required NVIDIA model through Nebius Token Factory. [Platform clarification](https://nebiusglobalaihackathon.devpost.com/details/faqs).

Do not claim use of Nebius AI Cloud, Serverless Jobs, Tavily, Supabase, local NVIDIA hardware, model fine-tuning, or a completed pilot unless actually added and verified.

## Platform feedback

On 10 October 2026, a production intake request to nvidia/Nemotron-3_5-Lightning through Nebius succeeded in 9.35 seconds. Delivered LangSmith intake and planner-tool records were inspected with empty inputs/outputs. Batch-agent attempts executed inventory and planning tools but full completion is still being verified; the latest attempt spent its completion budget on reasoning before returning a final response. These observations are individual smoke checks, not a latency or reliability benchmark. Add the completed-agent result and measured usage before submission; do not infer cost or reliability from configuration flags.

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
