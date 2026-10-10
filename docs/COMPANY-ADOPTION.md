# Company adoption plan

SpareCycle should earn adoption as a **reviewable batch-planning layer for laptop refurbishment workshops**. The initial decision is narrow: given diagnosed needs, approved exact part matches, available components, a parts budget, and a technician shift, which complete repairs should the coordinator assign?

The reachable buyer hypothesis is a regional refurbisher or managed school-IT provider with repeated batches of a few standardized models. Nonprofit reuse centers are an important social-use setting; their budget and ability to supply structured records must be established. No customer, partnership, interview, paid pilot, or commercial outcome is claimed.

The 520 stories in [FEATURES.md](FEATURES.md) are a discovery and delivery catalog. The 216 differentiation candidates are hypotheses about useful workflow combinations, not established market exclusivity. This plan prioritizes a few complete company workflows over building the entire catalog.

## What primary evidence establishes

| Source | What the source supports | Product implication and uncertainty |
| --- | --- | --- |
| [PCs for People FAQ](https://www.pcsforpeople.org/faqs/) | A reuse operator describes salvaging usable parts from computers unsuitable for refurbishment to repair other computers. | Donor-to-repair workflows are real. The page does not establish that allocating scarce parts is the operator's biggest bottleneck. |
| [Fixably part harvesting](https://kb.fixably.com/configuring-stocks/setting-up-part-harvesting) | Harvested stock, grade, model-linked parts, donor provenance, and optional harvested-parts priority are existing product capabilities. | Part harvesting and donor tracking cannot be presented as new. Any advantage must survive a comparison with the buyer's configured stock process. |
| [REAV ERP](https://www.reav-industry.com/erp) | Repair orders, parts and time costs, reverse bills of materials, recovered inventory, and AI integration are advertised together. | An all-in-one refurbishment ERP would face mature overlap. A small planning layer must reduce work rather than duplicate records. |
| [ReverseLogix recommerce](https://www.reverselogix.com/product/recommerce/) | The vendor describes disposition across repair, resale, parts, and other routes using factors such as grade, SKU value, and region. | Economic routing is already competitive territory. Whole-batch resource allocation is a hypothesis to test, not a capability assumed absent from this product. |
| [Blancco for ITAD](https://blancco.com/itad/) | Specialist erasure workflows and digitally signed per-device evidence are established products. | Integrate trusted sanitization evidence when appropriate. SpareCycle does not erase devices or issue erasure certificates. |

These sources confirm relevant workflows and substantial competition. Vendor pages are product claims, not independent performance evaluations. Public descriptions cannot establish all configuration options or prove that a competitor lacks a capability. Interviews and hands-on comparisons are still necessary.

## Positioning a coordinator can understand

“Choose a repair batch you can complete with the parts and bench time you have, and see the evidence behind each proposed assignment.”

The initial workflow should be:

1. Bring an approved inventory export and staff-reviewed diagnostic needs into a batch.
2. Resolve identity holds, exact part matches, stock availability, and evidence gaps.
3. Set the actual shift capacity and incremental purchase allowance.
4. Review a complete allocation, its exclusions, and a fair comparison under the same rules.
5. Test a relevant failure, approve a version for execution, and reserve the corresponding stock.
6. Record physical work, independent QA, sanitization evidence, and release separately.
7. Compare the original proposal with what actually passed and was released.

The prototype demonstrates the central planning and review steps with bounded inputs. Durable reservations, shared approval, execution tracking, and enforced release gates are roadmap requirements. A local review acknowledgement is not authorization to ship a device.

## Eight advantage hypotheses to test

These are coherent workflow bets. A listed feature being a candidate does not mean its individual mechanism is novel.

| Hypothesis | Why it might help | Existing overlap and uncertainty | Representative catalog IDs | Evidence needed |
| --- | --- | --- | --- | --- |
| Whole-batch opportunity cost | Explain why assigning a shared component to one complete repair changes the remaining batch; compare a small purchase bundle with the best existing-stock plan. | Inventory and economic routing already exist. Whether the buyer's system performs the same joint allocation must be checked. | SC-0101, SC-0102, SC-0120, SC-0228 | A matched-batch comparison including preparation and review time, not just the solver's theoretical count |
| Evidence changes propagate into decisions | A revoked or stale compatibility fact should identify affected assignments and approval versions instead of leaving a plausible-looking old plan. | Provenance and audit tools are common; integrated invalidation may already exist in configured workflows. | SC-0043, SC-0052, SC-0078 | Reviewer detects all deliberately invalidated allocations without excess false alerts |
| Retest effort follows decision value | Prioritize diagnostic uncertainty whose resolution could change which complete repairs fit the batch. | This is decision support around existing diagnostics, not AI diagnosis. Estimated retest value may be unreliable. | SC-0048, SC-0052 | Technicians agree that the proposed retest order saves review time or resolves a material bottleneck |
| Failure-resilient shift plans | Compare a nominal high-yield plan with one that preserves commitments across a few declared failures; identify a small reserve kit. | Scenario planning is established in operations tools. The useful level of complexity for a small workshop is unknown. | SC-0151, SC-0157 | Replayed incidents show a useful trade-off between reserved stock, lost capacity, and completed commitments |
| Complete demand kits | Optimize for an actual recipient request including its laptop, charger, adapter, and required capability rather than device count alone. | Order fulfillment and stock conservation are not new. The combination with repair choice must simplify the coordinator's work. | SC-0250, SC-0257 | Fewer incomplete commitments without hiding the effect on raw recovery count or cost |
| Aftercare informs review | Link field returns to the exact source and compatibility evidence, then bring concerning patterns back for human review. | Warranty analytics are already offered in repair software. Causal claims require careful validation. | SC-0293, SC-0300 | Traceable cohort outcomes and prospective evaluation; no automatic invalidation based on weak correlation |
| Small-network resource balancing | Compare a transfer with a purchase while accounting for delivery time and the source site's lost repair opportunity. | Multi-site systems and transfer workflows are mature. Lightweight adoption may matter more than algorithmic novelty. | SC-0443, SC-0458 | A real two-site example with reliable stock, transfer costs, and timing; demonstrate net benefit after coordination |
| Correctable outcome evidence | Preserve the difference between proposed, repaired, QA-passed, and released devices, with reporting corrections when evidence changes. | Audit reporting and sustainability tools already exist. The value is trustworthy operational reconciliation, not a new certification. | SC-0321, SC-0335 | Counts reconcile to device-level release records and cannot double-count plans as achieved outcomes |

Start by validating whole-batch opportunity cost and evidence propagation. They align with the current planner and one coordinator's daily decisions. Add retest or complete-kit planning only if early users identify those as material needs. Network allocation and aftercare learning require more data and should follow successful local use.

## Minimum requirements for real company operation

Browser-local workspaces can support evaluation and demonstration. They do not provide authenticated tenants, confidential shared records, concurrency control, or a company recovery guarantee. Company names and separate local workspaces are organizational conveniences, not a security boundary.

| Operational requirement | Minimum acceptance before a shared pilot | Catalog anchors |
| --- | --- | --- |
| Identity and isolation | Server-enforced membership and role checks; cross-organization reads and writes fail; membership removal takes effect reliably | SC-0001, SC-0003 |
| Stock commitments | Accepting a work order atomically reserves specific quantities; stale plans cannot consume stock already committed elsewhere | SC-0089, SC-0165 |
| Versioned decisions | Preserve reviewed inputs, limits, plan version, actor, and changes; a changed evidence or inventory version requires renewed review | SC-0052, SC-0120 |
| Physical release controls | A completed repair remains distinct from QA approval, sanitization evidence, supported-software policy, and release authorization | SC-0181, SC-0188 |
| Custody and evidence | Record authorized custody transfers and evidence origin; apply retention and access rules to sensitive serials and records | SC-0201 |
| Recovery and durability | Backups are restorable in a documented drill; failures and concurrent edits do not silently lose or overwrite approved work | SC-0485 |
| Provider and spending controls | Server-held secrets, durable usage limits, clear outage behavior, monitoring, and account-level spending review | M21, M25 |
| Import and export integrity | Reject invalid references, preserve provenance, identify mapping errors, and support a documented export/exit path | M02, M20 |
| Operational support | Named owner, incident response, escalation, user training, accessibility checks, and measured support effort | M24, M26 |

A relational shared database with transactional reservations is a plausible next architecture. Supabase could be evaluated for authenticated shared persistence; it is not necessary for the current local prototype and is not, by itself, proof that the controls above exist.

## Pilot protocol

### Discovery and data readiness

Interview five coordinators or buyers about a recent difficult batch. Ask them to walk through the actual spreadsheet or system, current part approval process, bench assignment, stock conflicts, failure handling, release checks, and reporting. Record who owns the data and who can approve a purchase.

Seek permission for one de-identified, staff-reviewed batch. Start with standardized models and approved exact component identifiers. Do not infer compatibility from a public model name, a generic specification, a language model, or a scraped listing. If the workshop cannot supply trustworthy inputs, address that bottleneck before interpreting any optimized output.

### Compare like with like

Freeze the same eligible devices, stock, diagnoses, compatibility, priorities, time, and purchase allowance for both plans. Preserve the coordinator's existing plan before showing the optimizer. Include import preparation, corrections, and review time in the comparison. The synthetic intake-order baseline in the demo is an algorithmic reference; it is not evidence that real coordinators perform worse.

Have a technician review assignments without implying that the mathematical result overrides physical judgment. Record each correction and its cause: data defect, compatibility uncertainty, missing constraint, solver issue, or operational preference. For an approved pilot, follow work through physical repair, QA, sanitization, and release.

### Measure outcomes separately

| Metric | Definition | Why it matters |
| --- | --- | --- |
| Time to approved queue | Data preparation plus planning plus human review time | Reveals whether the new process actually saves coordination effort |
| Invalid proposed assignments | Assignments rejected by reviewers, classified by cause | Identifies data and reasoning failures before execution |
| Reservation conflicts | Attempts to commit the same stock beyond available quantity | Tests shared-workflow correctness rather than a static plan alone |
| Plan-to-release conversion | Released devices divided by proposed devices, with the observation period stated | Separates mathematical feasibility from physical outcomes |
| Released devices per technician hour | Released devices linked to recorded bench time | Evaluates useful throughput without counting proposals as repairs |
| Incremental cost per release | Actual incremental purchases and labor attribution divided by released devices | Tests whether gains justify money and effort |
| Total adoption effort | Mapping, training, integration, and support hours | Prevents inference cost from being mistaken for total cost |
| Repeat voluntary use | Coordinators choosing the workflow again on eligible batches | Helps distinguish an impressive demo from a useful routine |

Agree on success thresholds with the buyer before the trial. Do not substitute arbitrary percentage targets for evidence. Report sample size, missing records, selection effects, and whether the results are synthetic, retrospective, or prospective.

Pause or revise the proposition if preparation takes longer than the decision it replaces, staff cannot supply trustworthy compatibility, required constraints remain missing, reviewers repeatedly reject proposals, or verified benefits do not exceed adoption cost.

## Reference datasets and Kaggle

A public laptop specification dataset can help a user normalize names, explore a catalog, or build an import exercise. Its license, source, retrieval date, transformation, and limitations should remain visible. Keep the original public record distinct from a workshop's physical device, diagnostic record, approved SKU match, and current stock.

The roadmap includes a dataset registry (SC-0390) and controlled conversion into evaluation fixtures (SC-0391). Those are broader than displaying public rows. Public data must not silently set a component to verified or certify hardware compatibility. The source license must permit the intended distribution, and derived fixtures must be labeled honestly. A public benchmark should include constraint failures and missing evidence, not only cases in which the optimizer looks good.

## Commercial path and adoption cost

Keep the initial proposition compatible with existing inventory and erasure tools. A reviewed export/import pilot has lower integration risk than replacing the workshop's operational system. Once repeat use is established, prioritize one connector demanded by multiple buyers.

The pricing experiments in [BUSINESS.md](BUSINESS.md) remain unvalidated: USD 49–149 per workshop per month for a useful small-shop service and USD 299–799 per organization per month for future shared controls and integrations. These are hypotheses, not current offers or forecasts. Nonprofit sponsorship is a possible route, not an agreed partnership.

Evaluate willingness to pay only after the coordinator and buyer can see total operating value. Costs include onboarding, compatibility curation, support, shared storage, integration maintenance, inference, and hosting. A small model bill cannot establish a sustainable business on its own.

The adoption decision is therefore concrete: can SpareCycle produce a better approved work queue, with reliable evidence and acceptable preparation effort, for a workshop that needs it repeatedly? The catalog supports that investigation; its size is not evidence that the answer is yes.

Research reviewed on 10 October 2026. Competitor capabilities and product packaging may change.
