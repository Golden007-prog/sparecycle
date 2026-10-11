# Dossier design and evidence plan

Audience: hackathon judges, a prospective company pilot lead, and a potential investor. Job: explain what the application does, prove the narrow working backend, make the product boundaries legible, and define the next investment decisions.

Format: a 14-page A4 portrait field guide, rendered with Typst as requested. Palette: workshop navy `#142C49`, inference cobalt `#315EEB`, paper `#F7F6F2`, cool grey `#596B7D`, line `#D8DEE8`. Bahnschrift carries concise product headlines; Segoe UI carries body text and tables. No decorative gradients, invented logos, or stock technology imagery.

Layout: left-aligned document, generous outer margin, real product captures with captions, a darker cover and two data-flow diagrams. The recurring visual motif is an evidence path with gates: source, proposal, verification, separate human decision. Module tables encode dependencies rather than decorative feature counts.

Review against brief: the product is a practical bench-to-code application, so the cover shows the actual application, not an abstract AI illustration. Navy/cobalt/cream follow the user's direction. A recorded failing-to-passing test comparison is the central proof. Roadmap, commercial hypotheses and unverified work have explicit status labels.

Source facts: docs/BACKEND-EVIDENCE.md, docs/TAVILY-INTEGRATION.md, docs/EXPANSION-PLAN.md, docs/RELEASE.md, and implementation files named in those documents. Tavily and Pilot Operations live acceptance facts will be updated only after the root agent confirms them.

Render QA: compile all pages; render every page at 96 PPI; inspect each page in two passes; check font substitution, overflows, pagination, diagrams, links and status language. Record actual results after rendering.
