# SpareCycle project dossier

Source: `dossier.typ`. Public deliverable: `public/sparecycle-project-dossier.pdf`.

The 14-page A4 dossier explains the product, the two data boundaries, Nebius/NVIDIA model roles, Tavily's research contract, harness controls, recorded test/PR evidence, company setup, commercial hypotheses and the selected 200-capability roadmap. The palette and layout rationale are in `DESIGN.md`.

## Rebuild

From the repository root, run:

```powershell
typst compile --root . docs/dossier/dossier.typ public/sparecycle-project-dossier.pdf
typst compile --root . --ppi 96 docs/dossier/dossier.typ 'docs/dossier/qa/page-{0p}.png'
```

Typst uses locally installed Bahnschrift and Segoe UI fonts, embedded in the PDF. No browser, remote rendering service or cloud account is involved. Three genuine application captures are copied byte-for-byte into `assets` with the correct JPEG extensions; their upstream filenames use `.png` even though their file signatures are JPEG. The Workshop capture is reused directly from `docs/assets`.

## QA record

11 October 2026: both complete render passes produced 14 A4 pages. All 28 rendered page images were visually inspected. The second pass improved the cover's credit line separation, removed the contents page from its own outline, added the data-boundary map, and clarified the baseline/candidate test figures. No clipped tables, missing figures, orphaned overflow pages or unexpected serif fallback appeared. `pdffonts` confirmed the intended fonts are embedded with Unicode mapping. PDF metadata and page size were checked with `pdfinfo`.

The release revision then updated Pilot Operations with its verified browser workflow, added the read-only Review queue and redacted export scope, and recorded the real local Tavily/Nebius result. The 14-page output was recompiled; changed pages 5, 6, 8 and 13 were visually inspected without overflow.

Final production verification was supplied from commit `61014aa1dff69e5405f747f2fbc86a76997d60b6`, Vercel deployment `dpl_4eWG18Cf6MoYDnVfJRfNefcbkNr6`. A live research call returned HTTP 200 with five model-matched T480 sources and one reported Tavily credit at `2026-10-11T05:21:27.309Z`; request `cbbb55f0-2a43-439d-b944-b5c33aa33781`. Nebius Nemotron Lightning returned a referenced summary and explicit uncertainty, with reported latency 2,324 ms. Trace: `908a6207-766d-4286-a992-53d7a6719a4f`. The final PDF records this production evidence and the 249-test passing regression suite / successful GitHub CI run `38114447888`, distinct from the recorded four-case diagnostic fixture. It does not add 200 shipped features to the release.

The production revision compiled to 14 A4 pages / 730,789 bytes. Revised pages 8 and 10 were rendered and visually inspected with no overflow or clipped content. Final SHA-256: `2652cfb941c8f0cfd900b668921d9c8c760787f269622ca908a36b2d043ba44f`.

Keep QA images local; they are ignored. Commit the source, design notes, correctly labeled source captures, and final PDF together with the release documentation.
