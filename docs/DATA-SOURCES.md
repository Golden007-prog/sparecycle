# Laptop reference catalog

SpareCycle includes 291 historical laptop listing variants from **[Laptops by Mohammad Anas on Kaggle](https://www.kaggle.com/datasets/anas123siddiqui/laptops)**. The catalog helps an intake operator find a model description and record reference specifications. It does not approve a diagnosis, component match, repair estimate, ownership, data erasure, safety check or release decision.

## Source and license

| Item | Recorded value |
| --- | --- |
| Dataset | `anas123siddiqui/laptops` |
| Kaggle version | 1 |
| Source file | `laptops.csv`, 305,500 bytes |
| Last updated | February 5, 2023 |
| Retrieved and profiled | October 10, 2026 |
| Declared license | CC0-1.0, confirmed through the Kaggle plugin, public dataset page and official CLI metadata |
| Author's stated provenance | Scraped from Flipkart's website |
| Expected updates | Never |
| CSV SHA-256 | `545a946bde1135f69d818ac53557f41811bdc423ca9a36e42016f255324428f9` |

The uploader declares **[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)**, which permits copying, adapting and commercial use of the rights waived by the uploader. CC0 does not establish other parties' rights or imply endorsement. The source does not include original product URLs, exact collection dates, retailer permission or manufacturer verification. This catalog is therefore a disclosed prototype reference, not a manufacturer-authorized commercial parts database.

The raw download and official metadata are kept in ignored `test-results/kaggle-source/`. The Python environment and download cache also stay under ignored `test-results/`. No Kaggle credentials are included in the project.

## What the actual data contains

The CSV contains **920 data records**, 846 distinct listing titles, and 11 columns including an unnamed row-index column. The source description calls it ten columns because that count excludes the index. Prices include the `₹` symbol; the catalog labels them **INR historical listing prices** without converting currencies. They are neither current offers nor used-device valuations, and must not feed the recovery planner's dollar budget.

The records were not clean enough to publish directly. There are 586 truncated listing titles, some shifted specification columns, 89 missing discount entries, 543 missing bundled-software entries and 14 missing warranty entries. A nonempty cell is not necessarily a valid specification: some OS cells contain graphics descriptions and some storage cells contain display descriptions.

| Processing result | Rows |
| --- | ---: |
| Downloaded source | 920 |
| Excluded for one or more quality rules | 613 |
| Removed duplicate accepted variants | 16 |
| Published listing variants | 291 |
| Brands in published catalog | 14 |

The importer applies deterministic rules: normalize whitespace and manufacturer capitalization; reject incomplete titles; require recognizable CPU, RAM, OS, storage and display formats; check display centimeter/inch consistency; check title/RAM capacity agreement where both are explicit; require a positive rupee-denominated price; and retain the first occurrence of duplicate manufacturer/title/specification combinations. It does not guess replacements for rejected values.

These checks detect format defects, not every incorrect retailer claim. For example, a syntactically valid RAM technology description can still be wrong. Model text is the full source listing after removing its leading brand, so multiple configurations of a product may remain distinct. This is deliberately not a canonical OEM model database. The filtered sample is biased toward complete listings and should not be used for market-share estimates, compatibility inference, price prediction or environmental-impact claims.

The complete exclusion counts and record numbers are in [`data/laptop-catalog-quality.json`](../data/laptop-catalog-quality.json). Reasons overlap for a single excluded record. `sourceRow` is the one-based CSV data-record number, excluding the header.

## App contract

[`data/laptop-catalog.json`](../data/laptop-catalog.json) contains:

```ts
{
  schemaVersion: 1,
  title: string,
  source: {
    datasetRef: string, url: string, license: string, licenseUrl: string,
    author: string, version: number, updatedAt: string, retrievedAt: string,
    file: string, sha256: string, provenance: string
  },
  limitations: string[],
  quality: { sourceRows: number, acceptedRows: number, duplicateRows: number, excludedRows: number },
  models: Array<{
    id: string, manufacturer: string, model: string,
    specs: { cpu: string, ram: string, storage: string, display: string, os: string },
    price: { amount: number, currency: "INR", kind: "historical listing" },
    sourceRow: number
  }>
}
```

The generated catalog is 119,056 bytes and enforces a 200,000-byte maximum. Catalog lookup is local. No catalog record contains verified part SKUs or a repair-pass flag. Adding a model to a company workspace must still require the operator's real device identifiers, technician-verified needs and evidence.

## Reproduce the import

The importer uses Python's standard library. Only its optional download step needs the **[official Kaggle CLI](https://github.com/Kaggle/kaggle-cli)** (`kaggle` package; version 2.2.4 was used for this import).

```powershell
$env:KAGGLE_CONFIG_DIR = 'C:/Kaggle'
python scripts/import-kaggle.py --download
python scripts/import-kaggle.py --check
```

For a downloaded source folder, use `python scripts/import-kaggle.py --source-dir path/to/source`. Download commands are `kaggle datasets metadata` and `kaggle datasets download`; see the [official dataset command documentation](https://github.com/Kaggle/kaggle-cli/blob/main/docs/datasets.md). The importer never reads credentials itself and never uploads anything. It verifies the reviewed CSV hash and the source's declared CC0 license before generating files. A changed source fails closed and requires a fresh review; it is not silently treated as the reviewed version. `--check` reproduces both artifacts in memory and checks for exact output agreement without writing.

## Selection notes

The Kaggle plugin was used to compare laptop datasets and inspect file lists. Popular `muhammetvarl/laptop-price` and `owm4096/laptop-prices` entries were excluded from this import because their metadata returned an unspecified “Other” license. `kuchhbhi/latest-laptop-price-list` declared CC0 and remains an alternative, but it was not imported. The selected dataset provided an explicit retailer provenance statement, an explicit license, rupee-denominated values and complete listing titles for a useful subset. Selection does not establish that all underlying retailer data rights have been cleared.
