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

The release revision then updated Pilot Operations with its verified browser workflow, added the read-only Review queue and redacted export scope, and recorded the real local Tavily/Nebius result. The 14-page output was recompiled; changed pages 5, 6, 8 and 13 were visually inspected without overflow. Production research verification is still explicitly pending in the status string until a fresh deployed receipt is supplied. Local test success alone does not establish deployed provider use. This document does not add 200 shipped features to the release.

Keep QA images local; they are ignored. Commit the source, design notes, correctly labeled source captures, and final PDF together with the release documentation.
