# Canonical AST conventions (v1)

These rules apply to the parser output and to the decoder so both target the same `Workbook` shape (`src/types/ast.ts`).

## Empty cells

- **Sparse storage:** Only non-empty cells appear under `sheet.cells`.
- An empty cell is **not** represented by a key: if an address is absent, the cell is empty.
- Do not store `null` / `empty` cell records in v1; omission is the only representation of emptiness.

## Sheet order

- `workbook.sheets` is an **ordered array**.
- Order matches the **source workbook**: first sheet in the file is index `0`, then second, etc.

## Cell address keys

- Keys use **Excel A1 notation**: uppercase column letters and a 1-based row, no `$`.
- Examples: `A1`, `B2`, `AA10`.
- Regex: `^[A-Z]+[1-9][0-9]*$`.
- Each `Cell`’s `address` must **equal** the key in `sheet.cells`.

## Supported values

- **string**, **number**, **boolean** only (see PRD §7 parsing).
- The cell’s `type` tag matches the runtime type of `value`.

## Unsupported Excel features (v1)

- **Formulas:** When SheetJS exposes a computed value, normalize to **string**, **number**, or **boolean** as appropriate; otherwise skip or stringify per parser policy (Phase 3).
- **Dates:** When SheetJS reports `t === "d"` and `v` is a `Date`, store **`type: "string"`** with **ISO 8601** (`toISOString()`). If only a numeric serial arrives without a `Date`, keep **`type: "number"`** (serial).
- **Errors:** Prefer a **string** like `#N/A` or omit the cell if empty after normalization.

The encoder/decoder must not introduce types outside this AST.
