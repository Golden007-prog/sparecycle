#let navy = rgb("142c49")
#let cobalt = rgb("315eeb")
#let paper = rgb("f7f6f2")
#let muted = rgb("596b7d")
#let linecolor = rgb("d8dee8")
#let pale = rgb("e9eefb")
#let ink = rgb("1c3044")
#let app = "https://sparecycle-topaz.vercel.app"
#let repo = "https://github.com/Golden007-prog/sparecycle"
#let research-status = "Production runtime verified on 11 October 2026 at 05:21 UTC: HTTP 200, five model-matched T480 sources and one reported Tavily credit. NVIDIA Nemotron Lightning on Nebius returned the referenced summary; reported latency was 2.324 seconds."
#let pilot-status = "Implemented and browser-checked: frozen plans, assignment, work records, blockers, referenced manual checks, scorecards and recoverable local exports. Full current checks gate declared checklist readiness; changed work and recovered copies reset that readiness."

#set document(title: "SpareCycle — product, backend evidence and investment dossier", author: "Oikantik Basu", description: "A bounded workshop and diagnostic-code review application using Nebius Token Factory and NVIDIA Nemotron.")
#set page(paper: "a4", margin: (top: 19mm, bottom: 18mm, x: 18mm), fill: paper,
  header: context if counter(page).get().first() > 1 { text(size: 8pt, fill: muted)[SpareCycle #h(1fr) Product & evidence dossier] },
  footer: context if counter(page).get().first() > 1 { text(size: 8pt, fill: muted)[11 October 2026 #h(1fr) #counter(page).display() / #counter(page).final().first()] })
#set text(font: "Segoe UI", size: 10pt, fill: ink)
#set par(leading: 4.2pt, spacing: 10pt)
#set heading(numbering: none)
#show heading.where(level: 1): it => block(above: 0pt, below: 14pt)[#text(font: "Bahnschrift", size: 28pt, weight: "semibold", fill: navy)[#it.body]]
#show heading.where(level: 2): it => block(above: 12pt, below: 5pt)[#text(font: "Bahnschrift", size: 15pt, weight: "semibold", fill: navy)[#it.body]]
#show link: it => text(fill: cobalt, it)
#set table(inset: 8pt, stroke: 0.5pt + linecolor)
#let lead(body) = text(size: 13pt, fill: muted, body)
#let small(body) = text(size: 8.5pt, fill: muted, body)
#let panel(title, body, dark: false) = block(width: 100%, fill: if dark { navy } else { pale }, inset: 14pt, radius: 5pt)[
  #text(font: "Bahnschrift", size: 15pt, weight: "semibold", fill: if dark { white } else { navy })[#title]
  #v(6pt)
  #text(fill: if dark { white } else { ink })[#body]
]
#let step(n, title, body) = block(breakable: false, below: 10pt)[#grid(columns: (25pt, 1fr), gutter: 9pt,
  text(size: 18pt, weight: "semibold", fill: cobalt)[#n],
  [#text(weight: "bold")[#title] #linebreak() #body])]
#let caption(body) = block(above: 6pt, below: 12pt)[#small(body)]
#let flow(title, body) = block(width: 100%, fill: white, stroke: 0.7pt + linecolor, inset: 12pt, radius: 4pt)[#text(weight: "bold", fill: navy)[#title] #linebreak() #small(body)]
#let newpage(title, subtitle) = { pagebreak(); heading(level: 1, title); lead(subtitle); v(9pt) }

#set page(fill: navy, header: none, footer: none)
#text(fill: white, font: "Bahnschrift", size: 18pt, weight: "semibold")[SpareCycle]
#v(16mm)
#text(fill: white, font: "Bahnschrift", size: 39pt, weight: "semibold")[A second life.\ A reviewed change.]
#v(8mm)
#text(fill: rgb("c6d5eb"), size: 15pt)[From laptop evidence to thoughtful repair plans and tested draft pull requests.]
#v(13mm)
#image("assets/review-overview.jpg", width: 100%)
#v(7mm)
#text(fill: rgb("c6d5eb"), size: 10pt)[Nebius Token Factory supplies inference. NVIDIA Nemotron proposes and reviews. The application keeps tests, budgets and human approval in control.]
#v(1fr)
#text(fill: white, size: 10pt)[Product, backend evidence & investment dossier] #linebreak()
#text(fill: rgb("c6d5eb"), size: 9pt)[Oikantik Basu · Best Apps and Agents track · 11 October 2026]

#pagebreak()
#set page(fill: paper,
  header: text(size: 8pt, fill: muted)[SpareCycle #h(1fr) Product & evidence dossier],
  footer: context text(size: 8pt, fill: muted)[11 October 2026 #h(1fr) #counter(page).display() / #counter(page).final().first()])
#heading(level: 1, outlined: false)[A guide to the product]
#lead[Read the working path first. Then assess the evidence and the investment gates.]
#v(9pt)
#outline(title: none, depth: 1, indent: 0pt)
#v(10pt)
#panel[The core proposition][A refurbishment coordinator needs a defensible allocation of scarce parts. A diagnostics engineer needs a reproducible defect translated into a narrow, tested change. SpareCycle brings those decisions into one product while preserving their different data and approval boundaries.]
#v(9pt)
#small[This dossier describes a bounded prototype and recorded synthetic pilot results. It does not claim certified hardware, enterprise certification, customer ROI, universal repository support, or hundreds of shipped features. Dates and proof links matter: a recorded run is not a fresh execution.]
#v(17pt)
#grid(columns: (1fr, 1fr), gutter: 15pt,
  flow[Browser-local Workshop][Reviewed inventory → constrained plan → technician workflow → exported evidence packet.],
  flow[Authenticated Review][Organization evidence → bounded code proposal → unchanged tests → separate approval → draft PR.])
#caption[The handoff between these paths is deliberate and human-reviewed. There is no implied shared identity, inventory synchronization or automatic physical release.]

#newpage[The job worth solving][Help teams move from an uncertain report to the next justified action.]
#grid(columns: (1fr, 1fr), gutter: 16pt,
  [== At the repair bench
  A batch of laptops arrives with uneven evidence, limited parts and limited technician time. A seemingly easy repair can consume the component that would complete several other devices.

  The coordinator needs a complete allocation, visible trade-offs and clear reasons to hold a device. A plausible AI answer alone is insufficient.],
  [== In the diagnostics project
  An engineer sees a fault report that may come from hardware, missing evidence or a software parser defect. A broad code agent may change more than this case warrants.

  The engineer needs attributable evidence, unchanged tests, a bounded candidate and a second person who can approve the exact change.])
#v(12pt)
#panel[One product, two accountable workflows][Workshop proposes how to use declared inventory. Review turns a supported diagnostic defect into a draft PR. The pilot joins them through a clear human workflow, not through an invisible automatic synchronization.]
#v(12pt)
#step[1][Capture what is known][Record the model, issue and actual evidence. Preserve unknowns rather than manufacturing diagnoses.]
#step[2][Propose an action within bounds][Allocate declared parts or request a narrowly scoped code proposal. Respect holds, budgets and supported profiles.]
#step[3][Require evidence before progression][Physical work needs technician checks. Code work needs a failing baseline, passing candidate and separate approval.]
#small[First customers to validate: community refurbishers, school IT teams and organizations maintaining endpoint diagnostics code. These are buyer hypotheses, not existing customers.]

#newpage[Workshop: make every part count][A visible plan for an explicitly bounded batch.]
#image("../assets/sparecycle-desktop.jpg", width: 100%)
#caption[Genuine application capture with a synthetic demonstration batch. The seven proposed devices and two-device comparison shown here belong to that fixture, not a measured customer improvement.]
#grid(columns: (1fr, 1fr), gutter: 17pt,
  [== What it does
  Validate supplied inventory, exact declared part identifiers, evidence links, holds, stock quantities, purchase spend and technician time. Compare with a feasible arrival-order baseline and replay selected shortages.],
  [== What stays with the team
  Confirm physical condition and compatibility, perform repairs, sanitize storage and complete QA. Local company profiles stay in this browser; shared warehouse transactions are outside the Workshop prototype.])
#small[Nemotron can read intake notes and call the supplied read-only inventory/planning tools. The deterministic planner owns allocation and totals. An exhausted search limit is shown honestly.]

#newpage[Pilot Operations: close the loop][Turn a frozen proposal into a reviewable record of what the team actually did.]
#panel[Release status][#pilot-status]
#v(12pt)
#grid(columns: (1fr, 1fr), gutter: 12pt,
  flow[Freeze the plan][Preserve the input, constraints, allocations and timestamp. Later batch edits cannot silently alter an earlier pilot.],
  flow[Run the bench][Assign a technician and due date. Record queued, active, blocked and reported completed work with reasons and history.],
  flow[Record evidence][Separate effort and incremental costs from estimates. Record manual function, sanitization and accessory checks.],
  flow[Explain the outcome][Compare proposals with reported completions and missing outcomes. Export a handoff packet with its limitations.])
#v(12pt)
== A bridge for people
The coordinator can hand an evidence packet to a diagnostics engineer when a supported software issue appears. Creating an authenticated Review case remains an explicit action. A local pilot record never grants access to an organization or a repository.

== Useful status, honest meaning
“Completed” means the technician recorded work. “Checklist ready” requires current functional, sanitization and accessory checks with evidence references. Changed work invalidates old checks. Neither status is independent hardware certification.

#panel[The important boundary][Pilot Operations is browser-local. It does not consume shared inventory, perform an erase, send messages, issue a compliance certificate or create a protected release approval.]

#newpage[Review: evidence to draft PR][Bind the laptop record, code snapshot, test result and human decision.]
#image("assets/passport-evidence.jpg", width: 100%)
#caption[Actual Review interface. Passport fields and diagnostic evidence in the recorded pilot are synthetic. A passport is a supplied record, not telemetry from an installed laptop agent.]
#step[1][Record the case][An organization member creates a laptop passport, appends evidence and opens a change request.]
#step[2][Connect the permitted project][The GitHub App and connecting person must both have the required repository access. The selected source and tests are pinned to a commit.]
#step[3][Investigate and propose][Nebius Nemotron classifies software, hardware or insufficient evidence. Only an eligible software case proceeds to a scoped parser patch.]
#step[4][Test, review and approve][Run the unchanged tests, obtain a fresh model review and require another authorized person to approve the exact candidate.]
#step[5][Create a draft][The trusted service creates a draft PR through the GitHub App. It does not merge or deploy the change.]
#small[*Review insights:* filter loaded records, compare evidence and proof references, and preview a redacted JSON or spreadsheet-safe activity handoff. The queue does not rerun tests or grant permission; existing server checks remain authoritative.]

#newpage[NVIDIA Nemotron on Nebius][Stage-based routing gives each model a clear job and a bounded request.]
#table(columns: (0.7fr, 1.2fr, 1.8fr), fill: (x, y) => if y == 0 { pale } else { white },
  [*Tier*], [*Job*], [*Recorded scope*],
  [Nano], [Selectable investigation], [Used in the recorded private case and a separate production investigation.],
  [Lightning], [Default investigation and Workshop assistance], [Recorded public investigation and read-only planning workflow.],
  [Super], [Patch writer and fresh reviewer], [Non-Ultra cases route these stages to Super; both completed in the private pilot.],
  [Ultra], [Explicit escalation], [Operator opt-in; bounded investigation test recorded. No quality superiority benchmark.])
#v(14pt)
#grid(columns: (1fr, 22pt, 1fr), align: center, gutter: 8pt,
  flow[Application server][Scope, schema, deadline, reservation and stage are fixed by trusted code.],
  text(size: 23pt, fill: cobalt)[→],
  flow[Nebius Token Factory][NVIDIA Nemotron inference through the OpenAI-compatible endpoint.])
#v(12pt)
== The harness keeps the authority
The model returns structured proposals. It receives no shell, network, file-write or publishing tools in Review. The trusted service validates outputs, runs the allowed operations and records the result.

Maximum Review JSON context is 100,000 bytes. Provider calls have a 40-second deadline and no automatic retries. Patch output is bounded to 8,192 tokens; investigation and review to 4,096. These are ceilings, not measured consumption for every run.

#small[Exact catalog identifiers and observed roles: #link(repo + "/blob/main/docs/BACKEND-EVIDENCE.md")[backend evidence]. Omni, vision and dedicated models are not integrated merely because a provider catalog lists them. This is not a simultaneous four-model debate.]

#newpage[Tavily: useful public references][Research official documentation, then ask Nemotron to explain only the supplied evidence.]
#panel[Runtime verification status][#research-status]
#caption[Recorded Tavily request: cbbb55f0-2a43-439d-b944-b5c33aa33781. Explicit keyless search mode; full manual scope remains unverified. #link(repo + "/blob/main/docs/RELEASE.md")[Production release ledger].]
#v(4pt)
#step[1][Ask a public model question][A technician enters a model name and a documentation question. No passport, serial number, inventory or project code is automatically included.]
#step[2][Call Tavily at runtime][The server performs one bounded search, restricted to configured official support/documentation domains. Up to five accepted results become source IDs.]
#step[3][Synthesize on Nebius][Nemotron receives plain-text snippets as untrusted data. A strict result schema requires findings to reference existing source IDs.]
#step[4][Review the original source][The UI shows source links, snippets, uncertainties and next checks. A technician confirms applicability to the actual device.]
#v(7pt)
#table(columns: (1fr, 1.7fr), fill: (x, y) => if y == 0 { pale } else { white },
  [*Control*], [*Effect*],
  [One search; 10-second search budget], [No silent retry loop or open-ended browsing.],
  [Five results; 128 KiB response ceiling], [Bounded provider material before model synthesis.],
  [Official-domain and URL checks], [Unsafe links and unsupported domains are discarded.],
  [Server-assigned citations], [The model cannot invent a clickable source URL.],
  [Empty evidence means abstention], [No uncited fallback presented as research.])
#caption[Citation-ID validation proves a reference exists, not that every generated sentence correctly interprets it. The source text and physical applicability still need review. #link(repo + "/blob/main/docs/TAVILY-INTEGRATION.md")[Research contract].]

#newpage[The safety is in the workflow][Keep identity, inference, execution and publication in distinct boundaries.]
#grid(columns: (1fr, 1fr), gutter: 12pt,
  flow[Identity and records][Supabase validates the user. Organization membership and role-aware database functions protect records. Public configuration is not a health claim.],
  flow[Inference][Nebius receives bounded case material. Strict schemas reject incomplete output. LangSmith is configured for operational metadata with raw inputs and outputs hidden.],
  flow[Execution][GitHub Actions runs original and candidate in separate restricted, digest-pinned containers. Credentials stay outside the test containers.],
  flow[Publication][A different member approves the bound evidence version, base commit and patch hash. The GitHub App creates only a draft PR.])
#v(13pt)
== Controls that matter together
- Tenant membership and repository access are checked separately.
- Durable Review reservations and job leases bound concurrent work and estimated spend.
- Provider uncertainty is surfaced rather than silently retried.
- Source policy restricts the candidate to a pure diagnostic parser.
- Test proof binds source, candidate, evidence, named tests and runner identity.
- Changed evidence or code invalidates the path to an old approval.

#panel[What these controls do not establish][They do not certify enterprise security, guarantee absence of prompt injection, prove all program behavior or establish physical repair. The Nebius Sandboxes adapter exists in source but the demonstrated execution provider is GitHub Actions.]

#newpage[Real calls. Real tests. A draft.][The recorded pilot uses synthetic inputs with genuine provider and GitHub execution.]
#grid(columns: (1fr, 1fr), gutter: 15pt,
  panel[Original parser][#text(font: "Bahnschrift", size: 35pt)[3 / 4] #linebreak() *Tests passed; one failed.* #linebreak() The existing suite demonstrates the reported defect.],
  panel[Exact candidate][#text(font: "Bahnschrift", size: 35pt)[4 / 4] #linebreak() *Tests passed; zero failed.* #linebreak() The same tests run against the candidate. Their contents stay unchanged.])
#v(12pt)
#image("assets/draft-pr.jpg", width: 100%)
#caption[Recorded public draft PR. A tested synthetic parser example establishes this narrow workflow, not arbitrary code repair or a physical laptop outcome.]
== Inspectable proof
#link(repo + "/pull/1")[Public draft PR #1] and #link(repo + "/actions/runs/38027193047")[public verifier run] are accessible evidence. The private pilot used a pinned verifier in the same private repository; its proof completed on 11 October 2026 at 03:29 UTC.

Private transport encrypts the bounded source package, binds the organization and repository, and retains a metadata-only proof artifact. The recorded flow denied self-approval, accepted a separate reviewer and denied an unrelated account.

#small[The detailed #link(repo + "/blob/main/docs/BACKEND-EVIDENCE.md")[evidence ledger] contains timestamps, digests, inspected trace scope and limitations. A screenshot or replay is not a fresh execution.]
#v(7pt)
#small[*Release checks:* 249 tests passed, zero failed. #link(repo + "/actions/runs/38114447888")[GitHub CI succeeded] for commit 61014aa, deployed on Vercel. This regression suite is distinct from the four-case diagnostic verifier shown above.]

#newpage[Start a company pilot simply][Use the public Workshop first; provision the protected code workflow deliberately.]
#grid(columns: (1fr, 1fr), gutter: 17pt,
  [== Workshop in a few steps
  #step[1][Open the demo][Visit the Workshop and inspect the clearly labeled synthetic batch.]
  #step[2][Create a local workspace][Name the company and set planning limits. Import supported CSV or JSON.]
  #step[3][Review and export][Check declarations, run a proposal, explore shortages and retain a local backup.]
  #link(app + "/app")[Open Workshop]
  ],
  [== Review with a second person
  #step[1][Sign in and organize][Use enabled Google sign-in; create an organization and invite a reviewer.]
  #step[2][Connect the selected repo][Install the GitHub App for the intended repository and prove repository access.]
  #step[3][Run the bounded case][Add evidence, investigate, patch, verify, review and independently approve a draft.]
  #link(app + "/review")[Open Review]
  ])
#v(9pt)
#panel[Private repositories require preparation][An operator provisions a trusted workflow, pinned commit, transport key and explicit binding in the selected private repository. The supported API accepts one pure JavaScript diagnostics module and one to four unchanged test files. This is not arbitrary-project self-service execution.]
#v(9pt)
#small[Google authentication has a recorded live return test. Customer SMTP is deferred; optional custom OIDC is not enforced company SSO. Corporate SSO, SCIM, retention policy, restore drills and support ownership remain rollout gates. #link(repo + "/blob/main/docs/REVIEW-PRIVATE-REPOSITORIES.md")[Private setup guide].]

#newpage[A focused business opportunity][Sell a measurable operational result after demonstrating it with a real team.]
#table(columns: (1fr, 1.1fr, 1.5fr), fill: (x, y) => if y == 0 { pale } else { white },
  [*Potential buyer*], [*Job to validate*], [*Pilot measure*],
  [Refurbishment coordinator], [Allocate scarce stock and explain deferrals], [Input preparation time; completed outcomes; plan changes; evidence gaps.],
  [School or nonprofit IT lead], [Prepare reliable devices for reuse], [Time held for missing evidence; completion and aftercare records.],
  [Endpoint diagnostics team], [Turn a reproducible parser defect into a reviewable fix], [Accepted evidence-to-draft time; human review effort; regressions; abstentions.],
  [Managed service provider], [Repeat a constrained workflow across clients], [Onboarding effort; tenant isolation tests; per-accepted-case cost.])
#v(13pt)
== Commercial hypotheses
A per-team subscription could cover the workspace, review history and operational reporting. A transparent usage allowance could cover research and model stages. A separate implementation service could cover qualified private verifiers and data migration. These are pricing hypotheses; no revenue or willingness-to-pay result is claimed.

== The unit economics to measure
Count search credits, model usage, verification runtime, storage, support effort and human review. Compare cost per accepted outcome with the actual existing process. Rejected and abstained cases consume resources too.

#panel[The investment test][Would one company use this workflow repeatedly, provide representative evidence, and pay after including setup and review time? Demonstrate that before expanding to fleet administration or general code review.]

#newpage[Invest in complete workflows][A 200-capability execution map, with dependencies and acceptance gates.]
#table(columns: (0.6fr, 2.1fr, 1.9fr), inset: 6pt, fill: (x, y) => if y == 0 { pale } else { white },
  [*Map*], [*Module*], [*Dependency / investment gate*],
  [EX01], [Evidence lifecycle], [Provenance, artifact storage, technician policy],
  [EX02], [Intake and asset control], [Shared identity and receipt ledger],
  [EX03], [Parts and compatibility], [Vendor authority and qualified review],
  [EX04], [Planning and resilience], [Validated constraints and frozen inputs],
  [EX05], [Bench execution], [Atomic stock and authenticated work history],
  [EX06], [QA and physical release], [Real test evidence and independent sign-off],
  [EX07], [Procurement and economics], [Supplier evidence and financial approvals],
  [EX08], [Company administration], [SSO lifecycle, recovery and retention],
  [EX09], [External integrations], [Scoped credentials, contracts and replay],
  [EX10], [AI evaluation and operations], [Held-out fixtures and measured reliability])
#v(9pt)
#small[Each module contains 20 selected, meaningful planned capabilities with a stable ID and observable acceptance criterion. These are curated from the existing backlog, not 200 additional shipped features. #link(repo + "/blob/main/docs/EXPANSION-PLAN.md")[Read all 200 acceptance gates].]
== The next investment sequence
*First:* observe a real workshop and diagnostics team using the supported workflow; measure the local Pilot Operations handoff and accepted code outcomes.

*Then:* qualified shared records, email delivery, company identity lifecycle, restore drills and independent security assessment.

*Expand only with evidence:* a second language profile, one read-only device-management connector, measured routing evaluations and controlled fleet rollout. Physical diagnostics and environmental claims need external ground truth.

#newpage[Try it. Inspect it. Judge the evidence.][The product is useful when each next action has a reason and a record.]
#panel[Live application][#link(app)[sparecycle-topaz.vercel.app] #linebreak() Workshop planning, authenticated Review and the documented demonstration.]
#v(10pt)
#grid(columns: (1fr, 1fr), gutter: 15pt,
  [== Product and source
  #link(app + "/app")[Workshop]

  #link(app + "/review")[Review]

  #link(app + "/demo")[Video demonstrations]

  #link(repo)[Source and setup]

  #link(repo + "/blob/main/docs/JUDGE-ACCESS.md")[Judge access and test paths]
  ],
  [== Evidence and next work
  #link(repo + "/blob/main/docs/BACKEND-EVIDENCE.md")[Backend evidence ledger]

  #link(repo + "/blob/main/docs/TAVILY-INTEGRATION.md")[Tavily contract and limitations]

  #link(repo + "/blob/main/docs/RELEASE.md")[Dated release verification]

  #link(repo + "/blob/main/docs/EXPANSION-PLAN.md")[200-capability delivery map]

  #link(repo + "/blob/main/docs/INVESTMENT-ROADMAP.md")[Investment priorities]
  ])
#v(14pt)
== The claim to remember
SpareCycle demonstrates a bounded chain from laptop evidence through Nebius Nemotron, isolated unchanged-test verification and independent approval to a draft PR. The Workshop complements it with inspectable repair allocation and explicit uncertainty.

The next product milestone is a repeatable customer workflow with measured outcomes. The roadmap is larger than the current build, and the dossier keeps that difference visible.

#v(1fr)
#small[Prepared from project source, recorded synthetic execution evidence and genuine product captures. No endorsements by Nebius, NVIDIA, GitHub, Supabase or Tavily are implied. Source artifacts and dates are available through the linked evidence ledger.]
