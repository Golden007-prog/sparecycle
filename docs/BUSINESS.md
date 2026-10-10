# SpareCycle: business hypotheses

## User and job

The initial user is a nontechnical refurbishment coordinator who must choose today's repair work from a mixed batch. The job is to turn diagnosed needs, tested components, declared compatibility, and limited bench time into a reviewable work queue.

The first commercial buyer hypothesis is a regional laptop refurbisher or managed school-IT provider handling repeated batches of standardized models. A nonprofit reuse center is a strong social-use setting, but its ability to pay cannot be assumed.

## Value to test

SpareCycle should answer:

- Which complete repairs fit this shift and parts budget?
- Which shared component is limiting recovery?
- Why did this candidate lose a part to another device?
- What changes if one donor component fails?
- Which work orders are ready for technician review, and which evidence is missing?

The commercial case would come from reduced coordination time, fewer stock conflicts, and more devices passing final QA per unit of labor. None of those gains has been measured. Projected repaired candidates are not revenue, delivered computers, verified reuse, or avoided emissions.

## Positioning and competition

Position the product as a batch-planning layer that accepts workshop exports and returns reviewable allocations and work orders.

[Fixably](https://kb.fixably.com/configuring-stocks/setting-up-part-harvesting) already supports harvesting and model-linked stock. [REAV](https://www.reav-industry.com/erp) connects repairs, reverse bills of materials, costs, inventory, and AI. [FixBot Pro](https://fixbot.pro/itad) targets diagnosis and disposition. SpareCycle must earn its place through usable joint allocation and verifiable constraints; generic inventory or chat features provide little distinction.

Potential distribution is through refurbishment networks, school managed-service providers, and existing inventory-system integrations. These are proposed channels, not partnerships.

## Pricing experiments, not offers

All amounts below are hypotheses in USD, excluding taxes and implementation work.

| Proposed experiment | Hypothesis to test |
| --- | --- |
| Free sample workspace and local import/export | Coordinators can assess value before handing over operational data. |
| $49–$149 per workshop per month | A small shop may pay for regular constrained planning if measurable time or yield improvement exceeds the fee. |
| $299–$799 per organization per month | Multi-site buyers may pay for shared inventory, permissions, audit history, and integrations once those features exist. |
| Sponsored nonprofit access | A commercial partner may fund access for reuse organizations; no sponsor has agreed. |

Do not present these as current plans, market-validated prices, or revenue forecasts.

## Validation sequence

1. Interview five coordinators about their last difficult batch, present tools, labor constraints, data quality, and purchasing authority.
2. Obtain permission to review one de-identified batch with staff-provided compatibility and diagnostics.
3. Compare its existing plan with SpareCycle under identical rules. Include the time spent cleaning inputs and reviewing suggestions.
4. Have technicians verify proposed assignments and record correction reasons.
5. If appropriate, follow completed repairs through final QA and release, then ask the buyer to evaluate a paid pilot.

A useful pilot should measure time to an approved work queue, stock conflicts, plan corrections, and completed releases per technician hour. Set thresholds with the buyer before the trial. No interviews, customers, paid pilots, or traction are currently established.

## Product stages and costs

The current scope is a single workshop prototype with browser-local state. It does not need Supabase. A paid team service would require authenticated shared records, permissions, component reservation, concurrent-edit handling, audit history, backups, deletion controls, and durable usage quotas.

Costs include inference, hosting, shared storage, operational support, data onboarding, and maintaining reliable import formats. Compatibility curation may cost more than inference. The available provider credit is a testing allowance, not a validated cost-of-goods estimate.

Compute per-batch cost from actual provider usage and include retries. In-memory request throttles cannot guarantee a shared spending ceiling.

## Risks and stop conditions

The largest risk is dirty source data: precise optimization over false diagnoses or compatibility is still wrong. Another is that small workshops already make good decisions manually and cannot justify input overhead. Incumbents may already offer sufficient batch tools or add them quickly.

Stop or revise the proposition if importing and reviewing a batch takes longer than the decision it replaces, if staff cannot supply trustworthy compatibility, or if a pilot shows no useful improvement. Repair outcomes remain dependent on physical work, final QA, data-wipe evidence, and supported-software policy.
