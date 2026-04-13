import type { Cell, CellValue, Workbook } from "@/types";
import type { VerificationDiff, VerificationResult } from "@/types/pipeline";

function primitiveValuesEqual(a: CellValue, b: CellValue): boolean {
  if (typeof a !== typeof b) return false;
  if (typeof a === "number") return Object.is(a, b);
  return a === b;
}

function cellsEqualByValue(a: Cell, b: Cell): boolean {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case "string":
      return a.value === b.value;
    case "number":
      return Object.is(a.value, b.value);
    case "boolean":
      return a.value === b.value;
    case "formula":
      return (
        b.type === "formula" &&
        a.formula === b.formula &&
        primitiveValuesEqual(a.value, b.value)
      );
    default: {
      const _n: never = a;
      return _n;
    }
  }
}

function compareSheetCells(
  sheetName: string,
  original: Readonly<Record<string, Cell>>,
  reconstructed: Readonly<Record<string, Cell>>,
  diffs: VerificationDiff[],
): void {
  const origKeys = Object.keys(original);
  const reconKeys = Object.keys(reconstructed);

  for (const addr of origKeys) {
    const o = original[addr]!;
    const r = reconstructed[addr];
    if (!r) {
      diffs.push({
        kind: "missing_in_reconstructed",
        sheetName,
        address: addr,
        expected: o.value,
        ...(o.type === "formula" ? { expectedFormula: o.formula } : {}),
      });
      continue;
    }
    if (o.type !== r.type) {
      diffs.push({
        kind: "cell_type_mismatch",
        sheetName,
        address: addr,
        expectedType: o.type,
        actualType: r.type,
      });
      continue;
    }
    if (o.type === "formula" && r.type === "formula") {
      if (o.formula !== r.formula) {
        diffs.push({
          kind: "formula_mismatch",
          sheetName,
          address: addr,
          expectedFormula: o.formula,
          actualFormula: r.formula,
        });
        continue;
      }
      if (!primitiveValuesEqual(o.value, r.value)) {
        diffs.push({
          kind: "value_mismatch",
          sheetName,
          address: addr,
          expected: o.value,
          actual: r.value,
        });
      }
      continue;
    }
    if (!cellsEqualByValue(o, r)) {
      diffs.push({
        kind: "value_mismatch",
        sheetName,
        address: addr,
        expected: o.value,
        actual: r.value,
      });
    }
  }

  for (const addr of reconKeys) {
    if (!(addr in original)) {
      const r = reconstructed[addr]!;
      diffs.push({
        kind: "missing_in_original",
        sheetName,
        address: addr,
        actual: r.value,
        ...(r.type === "formula" ? { actualFormula: r.formula } : {}),
      });
    }
  }
}

function buildSummary(diffs: readonly VerificationDiff[]): string {
  if (diffs.length === 0) {
    return "Round-trip OK: sheet count, names, and all cell values match.";
  }

  const counts: Partial<Record<VerificationDiff["kind"], number>> = {};
  for (const d of diffs) {
    counts[d.kind] = (counts[d.kind] ?? 0) + 1;
  }

  const parts: string[] = [];
  const push = (label: string, kind: VerificationDiff["kind"]) => {
    const n = counts[kind];
    if (n) parts.push(`${n} ${label}${n === 1 ? "" : "s"}`);
  };

  push("sheet count mismatch", "sheet_count_mismatch");
  push("sheet name mismatch", "sheet_name_mismatch");
  push("missing sheet (in reconstructed)", "missing_sheet_in_reconstructed");
  push("extra sheet (in reconstructed)", "extra_sheet_in_reconstructed");
  push("cell type mismatch", "cell_type_mismatch");
  push("formula mismatch", "formula_mismatch");
  push("cell value mismatch", "value_mismatch");
  push("cell missing in reconstructed", "missing_in_reconstructed");
  push("cell missing in original", "missing_in_original");

  return `Verification failed: ${parts.join(", ")}.`;
}

/**
 * Compare two canonical workbooks (e.g. parsed XLSX vs DSL-decoded AST).
 * Index-aligned sheets: same position must share the same sheet name to compare cells.
 */
export function verifyWorkbooks(original: Workbook, reconstructed: Workbook): VerificationResult {
  const diffs: VerificationDiff[] = [];

  if (original.sheets.length !== reconstructed.sheets.length) {
    diffs.push({
      kind: "sheet_count_mismatch",
      expected: original.sheets.length,
      actual: reconstructed.sheets.length,
    });
  }

  const pairCount = Math.min(original.sheets.length, reconstructed.sheets.length);
  for (let i = 0; i < pairCount; i++) {
    const os = original.sheets[i]!;
    const rs = reconstructed.sheets[i]!;
    if (os.name !== rs.name) {
      diffs.push({
        kind: "sheet_name_mismatch",
        index: i,
        expected: os.name,
        actual: rs.name,
      });
      continue;
    }
    compareSheetCells(os.name, os.cells, rs.cells, diffs);
  }

  for (let i = pairCount; i < original.sheets.length; i++) {
    diffs.push({
      kind: "missing_sheet_in_reconstructed",
      index: i,
      sheetName: original.sheets[i]!.name,
    });
  }
  for (let i = pairCount; i < reconstructed.sheets.length; i++) {
    diffs.push({
      kind: "extra_sheet_in_reconstructed",
      index: i,
      sheetName: reconstructed.sheets[i]!.name,
    });
  }

  const ok = diffs.length === 0;
  return { ok, diffs, summary: buildSummary(diffs) };
}
