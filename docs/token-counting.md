# Token counting (lab heuristic)

## Strategy

Token metrics in this project are **approximate**, not tied to a vendor tokenizer or a specific model.

- They are **deterministic**: the same UTF-16 string always yields the same count.
- They are **not** guaranteed to match OpenAI, Anthropic, Gemini, or local BPE tables.
- Use them to **compare formats** (JSON vs CSV vs approximate XML vs XLSXDSL1) on the same workbook, not to predict exact API billing.

## Estimator

We use a common coarse heuristic aligned with many “chars divided by 4” rules of thumb for English-heavy text:

\[
\text{tokens} = \left\lceil \frac{\max(0,\ \text{length}_{UTF\text{-}16})}{4} \right\rceil
\]

- `length` is JavaScript `string.length` (UTF-16 code units), including newlines.
- The empty string yields **0** tokens.

## Assumptions and limits

- **Sparse vs dense CSV:** CSV uses a bounded rectangle per sheet (min/max row/col of occupied cells). Empty positions inside that rectangle are blank fields; this can inflate CSV vs DSL for sparse layouts with distant cells.
- **Approximate XML:** Output is a **simplified** workbook/cell tree, not a byte-for-byte Office Open XML export. It is only a stand-in for “verbose structured markup.”
- **JSON:** Canonical JSON is produced with stable key order (sheet order preserved; cell keys sorted row-major).

For product-facing copy, refer users to this file when interpreting percentages in the token analytics UI.
