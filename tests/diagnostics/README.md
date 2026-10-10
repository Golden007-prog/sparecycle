# Controlled Review demonstration

`src/diagnostics/battery.mjs` is a deliberately faulty, synthetic parser that is **not imported by the product**. It drops a valid zero-percent reading. The four diagnostic tests expect the correct behavior and intentionally reproduce one failure on the baseline commit. The main product test suite does not include this isolated demonstration folder.

SpareCycle Review snapshots this one module and these existing tests, asks Nemotron for a bounded change, verifies baseline failure and candidate success in a separate container, and creates a **draft** pull request after an independent organization reviewer approves. The tests must remain unchanged. This fixture is not an actual laptop diagnostic, battery assessment, or evidence of a repaired physical device.
