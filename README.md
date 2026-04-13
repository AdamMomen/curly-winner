# XLSX Encoding Lab

**What it is:** A local web tool that turns Excel files (`.xlsx`) into a compact text format so AI assistants can read spreadsheets more reliably and at lower cost—then rebuilds the workbook so you can confirm nothing important was lost.

**Why it matters:** Standard spreadsheet files are bulky and awkward for AI. This project focuses on a **deterministic** (repeatable) path: upload → compact text → optional round-trip check.

---

**Technical detail** lives in [`docs/`](docs/README.md): format spec, data-shape rules, token notes, and links to product and architecture docs in the repo root.
