"""Build SpareCycle's reference-only catalog from a pinned public Kaggle CSV.

Uses only the Python standard library. Optional --download calls the official
Kaggle CLI; credentials stay in KAGGLE_CONFIG_DIR and are never read here.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
DATASET = "anas123siddiqui/laptops"
CSV_SHA256 = "545a946bde1135f69d818ac53557f41811bdc423ca9a36e42016f255324428f9"
RETRIEVED = "2026-10-10"
BRANDS = {name.casefold(): name for name in (
    "Acer", "Alienware", "Apple", "ASUS", "Avita", "Dell", "GIGABYTE",
    "HP", "Infinix", "Lenovo", "LG", "Mi", "MSI", "Nokia", "realme",
    "RedmiBook", "Samsung", "Ultimus", "Vaio",
)}


def normalize(value: str) -> str:
    return " ".join(value.split())


def build(source_dir: Path) -> tuple[dict, dict]:
    raw = (source_dir / "laptops.csv").read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != CSV_SHA256:
        raise ValueError("Source CSV differs from the reviewed version; review before updating the pinned hash.")
    metadata = json.loads((source_dir / "dataset-metadata.json").read_text(encoding="utf-8"))
    info = metadata.get("info", metadata)
    if [item.get("name") for item in info.get("licenses", [])] != ["CC0-1.0"]:
        raise ValueError("The downloaded metadata does not declare the expected CC0-1.0 license.")
    if info.get("ownerUser") != "anas123siddiqui" or info.get("datasetSlug") != "laptops":
        raise ValueError("Downloaded metadata identifies a different source dataset.")
    rows = list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig"))))
    models, excluded, duplicates, seen = [], [], [], set()
    reasons: Counter[str] = Counter()
    ram_pattern = re.compile(r"^(\d+) GB (?:LPDDR\dX?|DDR\d|Unified Memory) RAM$", re.I)
    storage_pattern = re.compile(r"^\d+(?:\.\d+)? (?:GB|TB) (?:SSD|HDD|EMMC|eMMC)(?:\|\d+(?:\.\d+)? (?:GB|TB) (?:SSD|HDD|EMMC|eMMC))*$", re.I)
    display_pattern = re.compile(r"^(\d+(?:\.\d+)?) cm \((\d+(?:\.\d+)?) inch\) (?:Touchscreen )?Display$", re.I)

    for index, original in enumerate(rows, start=1):
        row = {key: normalize(value) for key, value in original.items()}
        title = row["title"]
        why = []
        if title.endswith(("...", "…")):
            why.append("truncated_listing_title")
        first, _, model = title.partition(" ")
        manufacturer = BRANDS.get(first.casefold())
        if not manufacturer or not model or len(model) > 160:
            why.append("unrecognized_or_missing_model")
        # Reject obvious column shifts instead of moving values by guesswork.
        if not re.fullmatch(r"(?:Intel|AMD|Apple|Qualcomm) .+Processor(?: \([^)]*\))?", row["Processor"]):
            why.append("nonstandard_cpu_column")
        ram = ram_pattern.fullmatch(row["RAM"])
        if not ram:
            why.append("nonstandard_ram_column")
        if not row["OS"].endswith("Operating System") or "32 bit Windows 11" in row["OS"]:
            why.append("nonstandard_os_column")
        if not storage_pattern.fullmatch(row["SSD"]):
            why.append("nonstandard_storage_column")
        display = display_pattern.fullmatch(row["Display"])
        if not display or abs(float(display.group(1)) - float(display.group(2)) * 2.54) > 0.15:
            why.append("nonstandard_or_inconsistent_display")
        title_ram = re.search(r"\((\d+) GB/", title)
        if ram and title_ram and ram.group(1) != title_ram.group(1):
            why.append("title_ram_disagreement")
        # A displayed rupee symbol is the only basis for labeling currency INR.
        price_text = row["price"]
        price_match = re.fullmatch(r"₹([\d,]+)", price_text)
        amount = int(price_match.group(1).replace(",", "")) if price_match else 0
        if not 0 < amount <= 10_000_000:
            why.append("unrecognized_price_or_currency")
        if why:
            reasons.update(why)
            excluded.append({"sourceRow": index, "reasons": why})
            continue
        specs = {"cpu": row["Processor"], "ram": row["RAM"], "storage": row["SSD"],
                 "display": row["Display"], "os": row["OS"]}
        key = json.dumps([manufacturer, model.casefold(), specs], sort_keys=True)
        if key in seen:
            duplicates.append(index)
            continue
        seen.add(key)
        models.append({
            "id": f"kg-laptops-{index:04d}", "manufacturer": manufacturer,
            "model": model, "specs": specs,
            "price": {"amount": amount, "currency": "INR", "kind": "historical listing"},
            "sourceRow": index,
        })
    models.sort(key=lambda model: (model["manufacturer"].casefold(), model["model"].casefold(), model["sourceRow"]))
    quality = {"sourceRows": len(rows), "acceptedRows": len(models),
               "duplicateRows": len(duplicates), "excludedRows": len(excluded)}
    assert sum(quality[key] for key in ("acceptedRows", "duplicateRows", "excludedRows")) == len(rows)
    catalog = {
        "schemaVersion": 1,
        "title": "Historical laptop listing reference",
        "source": {
            "datasetRef": DATASET, "url": f"https://www.kaggle.com/datasets/{DATASET}",
            "license": "CC0-1.0", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
            "author": "Mohammad Anas", "version": 1, "updatedAt": "2023-02-05T18:11:41.817Z",
            "retrievedAt": RETRIEVED, "file": "laptops.csv", "sha256": digest,
            "provenance": "The Kaggle author describes this as a scrape of Flipkart laptop listings; original listing URLs and collection dates are not provided.",
        },
        "limitations": [
            "Reference listings from a dataset last updated in February 2023; not current offers or resale valuations.",
            "Model text preserves the complete source listing variant, not a manufacturer-verified canonical identifier.",
            "Specifications are unverified retailer listing claims; filters catch obvious format problems, not every factual error.",
            "No diagnosis, repair time, compatible part SKU, ownership, safety, wipe or quality-control approval is provided.",
            "The uploader declares CC0; independent retailer or manufacturer endorsement and upstream rights are not established.",
            "Rows with truncated names or malformed columns are excluded, so this catalog is incomplete and not representative of the laptop market.",
        ],
        "quality": quality,
        "models": models,
    }
    report = {
        "datasetRef": DATASET, "sourceSha256": digest, "profiledAt": RETRIEVED,
        **quality,
        "sourceColumns": list(rows[0]), "sourceUniqueTitles": len({row["title"] for row in rows}),
        "sourceMissingValues": {key: sum(not row[key].strip() for row in rows) for key in rows[0]},
        "excludedReasonCounts": dict(sorted(reasons.items())),
        "reasonCountsMayOverlap": True,
        "acceptedManufacturerCounts": dict(sorted(Counter(model["manufacturer"] for model in models).items())),
        "deduplication": "Same normalized manufacturer, full listing title and all retained specs; retain first source occurrence, not cheapest price.",
        "sourceRowDefinition": "One-based CSV data-record number, excluding the header.",
        "excluded": excluded, "duplicateSourceRows": duplicates,
    }
    return catalog, report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, default=ROOT / "test-results/kaggle-source")
    parser.add_argument("--download", action="store_true", help="Download using the official installed Kaggle CLI.")
    parser.add_argument("--check", action="store_true", help="Check committed outputs match the source without writing.")
    args = parser.parse_args()
    if args.download:
        cli = shutil.which("kaggle") or str(Path(sys.executable).with_name("kaggle.exe" if os.name == "nt" else "kaggle"))
        env = dict(os.environ)
        env.setdefault("KAGGLE_CONFIG_DIR", "C:/Kaggle")
        args.source_dir.mkdir(parents=True, exist_ok=True)
        subprocess.run([cli, "datasets", "metadata", DATASET, "-p", str(args.source_dir)], env=env, check=True)
        subprocess.run([cli, "datasets", "download", DATASET, "-f", "laptops.csv", "-p", str(args.source_dir), "--unzip", "--quiet"], env=env, check=True)
    catalog, report = build(args.source_dir)
    # Compact records keep the complete reviewed catalog below the 200 KB budget.
    outputs = {
        ROOT / "data/laptop-catalog.json": json.dumps(catalog, ensure_ascii=False, separators=(",", ":")) + "\n",
        ROOT / "data/laptop-catalog-quality.json": json.dumps(report, ensure_ascii=False, indent=2) + "\n",
    }
    if len(outputs[ROOT / "data/laptop-catalog.json"].encode("utf-8")) > 200_000:
        raise ValueError("Catalog exceeds its 200 KB size budget.")
    for path, text in outputs.items():
        if args.check:
            if not path.exists() or path.read_text(encoding="utf-8") != text:
                raise ValueError(f"Generated output does not match: {path.name}")
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding="utf-8", newline="\n")
    print(json.dumps({"checked" if args.check else "generated": True, **catalog["quality"],
                      "catalogBytes": len(outputs[ROOT / "data/laptop-catalog.json"].encode("utf-8"))}))


if __name__ == "__main__":
    main()
