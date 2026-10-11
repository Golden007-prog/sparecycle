# SpareCycle capability catalog

**Catalog baseline:** the story statuses and counts below describe the original workshop catalog. Later Review, research and pilot-operation releases are documented separately in [BALANCED-RELEASE.md](BALANCED-RELEASE.md), the [Review roadmap](REVIEW-ENTERPRISE-ROADMAP.md) and [release evidence](RELEASE.md). Do not add overlapping story counts together or present planned capabilities as shipped.

This catalog contains **520 actionable user stories across 26 modules**: **29 shipped capabilities in the bounded prototype** and **491 planned capabilities**. **216 stories are differentiation candidates** for research and customer testing. That flag does not mean an idea is exclusive, patented, absent from competitors, or validated by a buyer.

The catalog is a product backlog, not a claim that 520 features have been built. The 29 shipped entries describe individual behaviors within the current prototype, not 29 complete enterprise modules. Shared company operations require substantial additional work.

The machine-readable source of truth is [feature-catalog.csv](feature-catalog.csv). Each row describes a meaningful workflow or operational capability, with its intended user and an observable acceptance criterion. [COMPANY-ADOPTION.md](COMPANY-ADOPTION.md) connects the roadmap to buyer needs, competitors, pilot decisions, and enterprise requirements.

## How to read the catalog

| Field | Meaning |
| --- | --- |
| `id` | Stable story identifier, SC-0001 through SC-0520. Keep an identifier when refining a story. |
| `module_id`, `module` | Stable module identifier and readable workflow area. |
| `title` | Concise capability name. |
| `user_story` | User role and useful outcome. |
| `priority` | Sequencing hypothesis, using P0 through P3 below. |
| `target_user` | Primary role responsible for using or reviewing the capability. |
| `status` | `shipped` or `planned`; no partial implementation is represented as shipped. |
| `acceptance_criteria` | Observable condition for accepting the story; production work will need fuller specifications and failure cases. |
| `differentiator_candidate` | `true` for a workflow idea worth testing as part of an advantage hypothesis; otherwise `false`. |

A spreadsheet can filter `status=planned`, group by module, or filter `differentiator_candidate=true` to inspect the 216 candidates. All rows have a unique identifier, title, and user story.

- **P0:** Required for core decision correctness or a responsible shared operational pilot. This does not imply every P0 story is in the present release.
- **P1:** A next-stage capability when a pilot confirms the need.
- **P2:** Expansion requiring sufficient operational data, integration support, or business evidence.
- **P3:** Research or longer-term experiments without a delivery commitment.

Priorities are proposed sequencing, not contractual promises or a substitute for customer discovery. Dependencies, customer context, and implementation cost may change the order.

## Module index

Each module contains 20 stories. The final two columns count the shipped stories and candidate ideas within that module; the counts can overlap.

| Module | Workflow | Story range | Stories | Shipped | Candidates |
| --- | --- | --- | ---: | ---: | ---: |
| M01 | Identity and workspaces | SC-0001–SC-0020 | 20 | 0 | 0 |
| M02 | Intake and inventory | SC-0021–SC-0040 | 20 | 1 | 1 |
| M03 | Diagnostics and evidence | SC-0041–SC-0060 | 20 | 0 | 11 |
| M04 | Exact compatibility | SC-0061–SC-0080 | 20 | 1 | 13 |
| M05 | Parts and donors | SC-0081–SC-0100 | 20 | 4 | 10 |
| M06 | Batch optimization | SC-0101–SC-0120 | 20 | 6 | 18 |
| M07 | Scheduling and technician capacity | SC-0121–SC-0140 | 20 | 0 | 11 |
| M08 | Failure replay and uncertainty | SC-0141–SC-0160 | 20 | 4 | 18 |
| M09 | Work orders and bench execution | SC-0161–SC-0180 | 20 | 4 | 7 |
| M10 | Quality assurance and release | SC-0181–SC-0200 | 20 | 0 | 5 |
| M11 | Data sanitization and chain of custody | SC-0201–SC-0220 | 20 | 0 | 2 |
| M12 | Procurement and supplier operations | SC-0221–SC-0240 | 20 | 0 | 8 |
| M13 | Demand and recipient matching | SC-0241–SC-0260 | 20 | 0 | 17 |
| M14 | Distribution and delivery | SC-0261–SC-0280 | 20 | 0 | 2 |
| M15 | Returns warranty and repair feedback | SC-0281–SC-0300 | 20 | 0 | 13 |
| M16 | Finance and unit economics | SC-0301–SC-0320 | 20 | 0 | 7 |
| M17 | Circularity and impact evidence | SC-0321–SC-0340 | 20 | 0 | 18 |
| M18 | Analytics and operational learning | SC-0341–SC-0360 | 20 | 0 | 17 |
| M19 | Enterprise governance and audit | SC-0361–SC-0380 | 20 | 0 | 0 |
| M20 | Integrations and data exchange | SC-0381–SC-0400 | 20 | 0 | 3 |
| M21 | AI assistance and evaluation | SC-0401–SC-0420 | 20 | 4 | 8 |
| M22 | Collaboration and approvals | SC-0421–SC-0440 | 20 | 0 | 4 |
| M23 | Multi-site and network planning | SC-0441–SC-0460 | 20 | 0 | 17 |
| M24 | Accessibility training and knowledge | SC-0461–SC-0480 | 20 | 2 | 4 |
| M25 | Security privacy and reliability | SC-0481–SC-0500 | 20 | 3 | 0 |
| M26 | Commercial deployment and product administration | SC-0501–SC-0520 | 20 | 0 | 2 |
| **Total** | | | **520** | **29** | **216** |

## What the current shipped labels mean

The existing planner checks declared exact part identifiers, stock quantities, evidence references, purchase allowance, and technician time. It proposes complete repairs, compares them with an intake-order baseline under the same limits, supports selected failure scenarios, and exports reviewable work orders and evidence. The bounded AI workflow extracts notes and uses allowlisted tools; the deterministic server result remains authoritative. The catalog also recognizes verified keyboard/mobile behavior and selected API protections.

These capabilities operate on a bounded prototype schema and declared inputs. A `verified` part flag represents a supplied declaration, not hardware certification. The sample is synthetic. A proposed repair is not a physically completed, sanitized, QA-approved, supported, or delivered computer. The planner does not diagnose hardware or authorize release.

Company onboarding, spreadsheet import, and reference-data work may evolve alongside this catalog. A nearby feature is not automatically shipped: a story changes status only when its own acceptance criterion has been checked. For example, spreadsheet mapping is broader than accepting one fixed CSV template, and a dataset registry requires provenance and licensing controls beyond displaying reference rows.

The baseline also lacks authenticated shared storage, atomic team reservations, enforceable release gates, and a durable audit history. Local company labels or separate browser workspaces do not establish account isolation.

## Why 216 candidate ideas, rather than 216 uniqueness claims

Candidates emphasize combinations that could improve a repair coordinator's decisions: evidence linked to allocations, uncertainty affecting the next diagnostic action, failure-resilient plans, complete recipient kits, aftercare feedback, or verified outcomes. Routine account controls, stock counts, security settings, and many necessary operational features are deliberately not flagged.

Some candidates will already exist in specialist products. Others may add little value once integration and data-cleaning costs are measured. Several could be ordinary features in isolation and useful only as part of a coherent workflow. The eight hypotheses in [COMPANY-ADOPTION.md](COMPANY-ADOPTION.md) are the unit of market validation; the 216 flags are a discovery pool, not 216 separate product claims.

## Delivery sequence

| Stage | Deliverable | Decision gate |
| --- | --- | --- |
| Current demonstration | Bounded recovery planning with transparent assumptions, scenarios, evidence, and a real model/tool path | Reproducible fixtures and clearly stated prototype limits |
| Company evaluation | Reviewed organization setup, import templates, export/backups, and licensed reference-data context | A coordinator can prepare an approved batch without developer help; local-only limits remain explicit |
| Shared operational pilot | Authentication, organization isolation, transactional reservations, reviewer roles, audit history, QA/sanitization gates, restore drills, and spend controls | Independent access, concurrency, recovery, and release-state checks pass |
| Measured planning value | Compare reviewed plans with the workshop's actual process and follow outcomes to release | Benefits exceed input preparation, integration, and review effort |
| Focused expansion | Select one or two demonstrated advantages: retest prioritization, complete kits, robustness, or network allocation | Buyer willingness to adopt and trustworthy source data are established |

Building every catalog row before testing a workshop would obscure the product's main value. The next product decision is which complete workflow a real coordinator will use repeatedly, and which minimum controls make that workflow dependable.

## Data and measurement discipline

Kaggle or other public datasets can support licensed reference catalogs, import experiments, or reproducible evaluation fixtures. They cannot establish exact physical compatibility, current stock, repair eligibility, diagnostic truth, or release readiness for an actual device. Keep public reference data distinct from workshop declarations and recorded evidence.

Benchmark labels must distinguish synthetic fixtures, historical company data, and prospective outcomes. Count proposed recoveries separately from completed repairs and released devices. Treat environmental estimates as estimates with an explicit method, not certified impact. Do not infer customer traction, emissions avoided, revenue, or savings from the demonstration.

## Catalog maintenance

1. Refine the acceptance criterion and dependencies before implementation.
2. Check the full workflow, adverse cases, and appropriate evidence.
3. Update the CSV status only after that criterion is met; retain the stable ID.
4. Review candidate flags during competitor and buyer research.
5. Recompute published counts whenever rows or flags change.

The catalog was prepared on 10 October 2026. It records a roadmap assessment, not a guarantee of delivery dates or market novelty.
