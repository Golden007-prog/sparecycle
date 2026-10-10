# SpareCycle: research and product choice

Research date: 10 October 2026. Sources below establish existing activities and advertised capabilities. They do not establish customer demand for SpareCycle, competitor absence, or demonstrated environmental benefit.

## Problem grounded in existing work

Laptop reuse organizations already recover components from unsuitable devices to refurbish others. [PCs for People explicitly describes this practice](https://www.pcsforpeople.org/faqs/). [Free Geek describes donation intake, data handling, refurbishment, testing, and recycling](https://www.freegeek.org/about/our-process); its [volunteer program includes component testing and logging](https://www.freegeek.org/take-action-donate-technology/volunteer).

This supports a concrete workflow: a coordinator has mixed device needs, imperfect stock, and limited bench capacity. It does **not** prove allocation is their greatest bottleneck or quantify time lost. Those are interview and pilot questions.

SpareCycle proposes a decision aid for that workflow: choose a feasible combination of complete repairs instead of evaluating each device independently. It retains exact compatibility declarations and exposes why a part was allocated or a device remained blocked.

## Competition: a narrow contribution in a mature category

| Product / primary source | Existing advertised capability | Implication for SpareCycle |
| --- | --- | --- |
| [Fixably part harvesting](https://kb.fixably.com/configuring-stocks/setting-up-part-harvesting) | Harvested stock, grades, model-linked components, donor provenance, and harvested-part preference in repair orders. | Stock and donor tracking are established features. |
| [REAV ERP](https://www.reav-industry.com/erp) | Repair orders, per-device costs, model-specific reverse bills of materials, recovered stock, and AI access through MCP. | An AI refurbishment dashboard is insufficient differentiation. |
| [FixBot Pro for refurbishers](https://fixbot.pro/itad) | Diagnostic plans, repair-versus-part-out routing, and estimates of repair time and parts cost. | Avoid positioning this as a new AI diagnostic assistant. |
| [ITADTools resale readiness](https://www.itadtools.com/features/resale-readiness) | Device disposition scores using health, market value, and cosmetic information. | Per-device scoring is also established. |

The research did not establish whether these products support the exact proposed joint allocation problem. Absence from a public feature page is not proof of absence.

The defensible hypothesis is narrower: a lightweight, importable planning layer that shows the whole batch, enforces scarce-stock constraints, compares transparent baselines, and recalculates after a failed component. It could complement an existing inventory system rather than replace it.

## Why this concept was selected

The six scores below are subjective judgments, not market measurements or judge predictions. They assume a twenty-day prototype window and no advantage from existing code.

| Dimension / 5 | SpareCycle | Access Continuity |
| --- | --- | --- |
| Usefulness | 5 | 4 |
| Differentiation | 3 | 3 |
| Technical depth | 5 | 5 |
| Reachable commercial buyer | 4 | 3 |
| Demo clarity | 5 | 5 |
| Feasibility | 4 | 4 |

SpareCycle has an immediately legible unit of planning: complete device candidates within a fixed stock and workshop budget. Its whole-batch trade-offs and donor-failure replay are visible in a short demo. It still needs trustworthy device data and operator validation.

The campus alternative remains useful, but [Ad Astra advertises building-shutdown recovery](https://www.aais.com/solutions/event-scheduling-management), while [Everbridge Bridge](https://www.everbridge.com/products/bridge/) and [Prepare](https://www.everbridge.com/products/prepare/) cover dependencies, preparedness, and continuity. Campus route and capability declarations also make real-world suitability harder to validate within a small prototype.

## Lessons from verified prior winners

The [official Nebius Serverless AI Builders Challenge winner announcement](https://nebius.com/blog/posts/serverless-ai-builders-challenge-winners) names MediSimplifier first, goldandrei's evaluation application second, Balagan third, and Archon as the special Agents winner. This was a **different competition**, not the current Global AI Hackathon.

Reusable mechanisms, rather than copied products:

- [MediSimplifier](https://github.com/deepset01-sys/medisimplifier-nebius): narrow human need and explicit evaluation. SpareCycle should measure structured extraction against reviewed records.
- [goldandrei evaluation app](https://github.com/goldandrei/Nebius-Serverless): compare alternatives against the same task. SpareCycle should show baselines and optimized outcomes on identical inputs.
- [Balagan](https://github.com/zahere/balagan): introduce failures and examine system behavior. SpareCycle should replay an unavailable donor component and show the revised allocation.
- [Archon](https://github.com/upgradedev/archon_nebius): keep deterministic checks distinct from model interpretation. SpareCycle should make the allocator authoritative and keep intake reviewable.

These are design inferences from the winners' published work. They do not imply that copying mechanisms guarantees an award or that all published systems have independently verified production performance.

## Evaluation before claims

Use pre-specified fixtures, including cases where optimization offers no benefit. The implemented baseline is intake-order greedy allocation, preferring lower cash and then part-preparation time; it does not represent a measured human operator. The allocator's objective is lexicographic: complete repair count, summed priority, lower incremental cash, then lower technician time. Donors are dedicated inventory sources, not simultaneous repair candidates. Compare baseline and allocator under the same compatibility, stock, budget, and time rules.

| Question | Evidence to collect |
| --- | --- |
| Does allocation preserve resources? | Zero duplicate component use, negative stock, or unauthorized donor use across the test suite. |
| Does each repair candidate have every required part? | An independent plan validator rejects incomplete assignments. |
| Are constraints actually enforced? | Boundary cases for stock quantities, exact time/budget limits, unknown compatibility, and unavailable components. |
| Is the objective implemented correctly? | Brute-force comparison on small fixtures; expose incomplete-search status on capped cases. |
| Can the model structure records reliably? | A fixed, manually reviewed set of notes; report field accuracy, corrections, and unresolved records. |
| Does it help coordinators? | A pilot comparing review time and corrections on matched batches. This has not been conducted. |
| Does it improve actual recovery? | Post-repair QA and release records, not merely solver output. No such outcome is established yet. |

Recorded domain check on 10 October 2026: the targeted recovery suite passed 11 tests, including an independent brute-force oracle across 24 varied small fixtures and capped-search feasibility. With the synthetic default's $25/180-minute limits, the baseline yields five projected candidates and the allocator seven; a failed donor-RAM record reduces the latter to six. This is fixture evidence, not population-level uplift or a physical pilot.

A target of zero constraint violations remains an acceptance criterion for broader evaluation. Any demo improvement describes synthetic projected candidates, not computers already returned to service.

## Data limits and next research

Start with a small standardized fleet and exact approved part relationships. Record the source, reviewer, and date; block unknown compatibility. A fictional verified field is a scenario declaration, not manufacturer approval.

The next useful research is five coordinator interviews and one permissioned, de-identified batch review: how donors are authorized, where compatibility is recorded, what consumes technician time, which integrations matter, and who controls purchasing. Do not contact people or claim partnerships without authorization and actual evidence.
