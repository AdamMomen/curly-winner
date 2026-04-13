# XLSXDSL1 — Text encoding for canonical workbook AST (v1)

This document is the normative spec for **XLSXDSL1**. Encoders and decoders for the lab pipeline must conform to it. The in-memory shape is [`ast-conventions.md`](./ast-conventions.md) / `src/types/ast.ts`.

---

## 1. Goals

| Goal | Meaning |
|------|---------|
| **Deterministic** | One canonical `Workbook` maps to exactly one XLSXDSL1 document (byte-for-byte given fixed UTF-8 line endings). The same document always decodes to the same AST. |
| **Reversible** | `decode(encode(workbook))` yields a `Workbook` equal to the original (per Phase 11 verification rules). |
| **Compact** | Prefer one line per occupied cell, minimal punctuation, no redundant coordinates. |
| **Legible to an LLM** | Regular structure: fixed header, `sheet` blocks, `---` separators, predictable `A1 s:"..."` lines. |

---

## 2. Workbook-level syntax

### 2.1 Document encoding

- Text is **UTF-8**.
- Lines end with **LF** (`\n`) only in the canonical serialized form. CR or CRLF in input may be normalized to LF before parsing (decoder option; canonical output uses LF).

### 2.2 Header (version marker)

The **first line** of the document must be exactly:

```text
XLSXDSL1 v1
```

No leading BOM. No leading/trailing whitespace on that line.

If the first line is missing or differs, the document is **invalid** XLSXDSL1 v1.

### 2.3 Sheet separator

Sheets are separated by a line that contains **only** three hyphen-minus characters (optionally followed by ASCII spaces or tabs, then end of line):

```text
---
```

The separator must appear **between** two sheet blocks, not before the first sheet or after the last.

### 2.4 Overall structure

```text
XLSXDSL1 v1
<optional blank lines>
<sheet block>
---
<sheet block>
...
```

- A workbook with **zero sheets** is valid: header plus optional blank lines only.
- Blank lines may appear after the header and **between** cell lines inside a sheet (they are ignored).
- Trailing newline at end of file is allowed.

---

## 3. Sheet-level syntax

### 3.1 Sheet declaration

Each sheet block begins with exactly one **sheet header line**:

```text
sheet <name>
```

`<name>` is decoded in one of two ways:

1. **JSON string form:** If the first non-space character after `sheet ` is `"`, the name is the result of parsing a **JSON string** (RFC 8259) starting at that `"` through its closing quote. Escapes: `\"`, `\\`, `\n`, `\r`, `\t`, `\uXXXX`.
2. **Bare form:** Otherwise, the name is the **remainder of the line** after `sheet ` (no trim of interior characters; strip only a single trailing `\r` if present after CRLF normalization).

Bare form is used when the name has no leading quote; encoders should use bare form when the name is short and unambiguous (see §6).

After the sheet header line come **zero or more cell lines** (§4).

### 3.2 Cell block boundaries

All non-blank, non-`---` lines after a `sheet` line belong to that sheet until the next `---` or end of file.

### 3.3 Sparse sheets

Only **non-empty** cells appear. Empty cells are omitted entirely (matches sparse `Sheet.cells` in the AST). There is no explicit “empty cell” token.

---

## 4. Cell-level syntax

### 4.1 Address

Each cell line starts with an **A1 address** in uppercase letters and a 1-based row:

- Pattern: `^[A-Z]+[1-9][0-9]*$` (same as AST).
- One ASCII space (U+0020) separates the address from the type marker.

### 4.2 Type marker

Immediately after the space:

| AST `type` | Marker | Payload |
|------------|--------|---------|
| `string` | `s:` | JSON string (double-quoted, RFC 8259 escapes). |
| `number` | `n:` | JSON number (finite; no `NaN` / `Infinity`). |
| `boolean` | `b:` | Literal `true` or `false` (ASCII, lowercase). |
| `formula` | `f:` | JSON object: `{"formula": string, "value": ...}` where `formula` is non-empty and `value` is a JSON string, finite number, or boolean (cached result). |

No space between the marker prefix and the payload (`s:"hi"`, not `s: "hi"`).

### 4.3 Value escaping

- **Strings:** Always the JSON string production after `s:`. This handles quotes, newlines, Unicode, and control characters unambiguously.
- **Numbers:** JSON number syntax after `n:`.
- **Booleans:** Only `b:true` or `b:false`.
- **Formulas:** `f:` plus a single JSON object (not pretty-printed with newlines inside the cell line). The `formula` field is the text from the XLSX reader (e.g. SheetJS); it may or may not include a leading `=`.

### 4.4 Null / empty

- **Missing cell:** omit the line.
- **No `null` keyword** and no empty payload for “empty cell” in v1.

---

## 5. Parsing rules (decoder)

1. **Normalize newlines** (if allowed): CRLF or lone CR → LF.
2. **Split** the document into lines; track1-based line numbers for errors.
3. **Verify** line 1 is exactly `XLSXDSL1 v1`.
4. **Partition sheets:** Scan lines in order. Skip blank lines until the first `sheet` line starts a block. When a `---` line is found at sheet-block depth, close the current block and start the next after any following blank lines. `---` must not be the first content after the header (no sheet yet).
5. **Per sheet:** Parse the first line as `sheet <name>`. Each following line until `---` or EOF: if blank, skip; else parse as a cell line.
6. **Cell line:** Match `^([A-Z]+[1-9][0-9]*)\s+(s|n|b|f):(.+)$`. If no match → invalid.
   - `s:` — `JSON.parse` the payload; must yield a string.
   - `n:` — `JSON.parse` the payload; must yield a finite number.
   - `b:` — payload must be exactly `true` or `false`.
   - `f:` — `JSON.parse` the payload; must yield an object with string `formula` (non-empty) and `value` a string, finite number, or boolean.
7. **Duplicate address** in the same sheet → invalid.
8. **Cell order:** Canonical encoder output sorts cell lines by **row-major order**: increasing row, then column (column index from A1 with A=0, B=1, …, Z=25, AA=26, …). Decoders may accept any order but must reject duplicates.

### 5.1 Invalid DSL handling

Implementations should **fail closed**: on any violation, report an error with line number (and sheet name if known). Partial AST from invalid input is out of scope for v1.

---

## 6. Canonical encoding hints (encoder, Phase 6)

These are **normative for output** once the encoder exists:

- **Sheets:** Emit in `workbook.sheets` order.
- **Sheet names:** Emit `sheet ` + bare name when all are true: non-empty, `name === name.trim()`, the first character is not `"`, and the name contains no C0 control characters (U+0000–U+001F) or U+007F. Otherwise emit `sheet ` + `JSON.stringify(name)`.
- **Cells:** Emit one line per cell, row-major sorted.
- **No trailing spaces** on lines; single LF between lines; final line may end with LF.

---

## 7. Examples

### 7.1 Minimal (one sheet, two cells)

```text
XLSXDSL1 v1

sheet Summary
A1 s:"Total"
B1 n:100
```

### 7.2 Multi-sheet

```text
XLSXDSL1 v1

sheet Summary
A1 s:"Total"

---

sheet Details
Z99 b:true
```

### 7.3 Sparse (gaps between addresses)

```text
XLSXDSL1 v1

sheet Data
A1 s:"corner"
C3 n:-2.5
AA10 b:false
```

Only three occupied cells exist; `B1`, `A2`, etc. are empty in the AST.

---

## 8. Relationship to AST

| AST | XLSXDSL1 |
|-----|----------|
| `Workbook.sheets` order | Order of `sheet` blocks separated by `---` |
| `Sheet.name` | `sheet` line payload |
| `Sheet.cells` keys | Cell line addresses |
| `Cell.type` / fields | `s:` / `n:` / `b:` payloads; `f:` JSON `{ formula, value }` |

For full AST rules (addresses, unsupported Excel features), see [`ast-conventions.md`](./ast-conventions.md).
