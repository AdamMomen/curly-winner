import * as XLSX from "xlsx";
import type { CellObject, WorkBook, WorkSheet } from "xlsx";

import { decodeA1 } from "@/lib/a1";
import { workbookEncodeSchema } from "@/lib/schemas";
import type { Cell, Workbook } from "@/types";

export type WorkbookToXlsxResult =
  | { ok: true; buffer: ArrayBuffer }
  | { ok: false; error: string };

/** Default download name (no path). */
export const RECONSTRUCTED_XLSX_FILENAME = "curly-winner-reconstructed.xlsx";

const INVALID_SHEET_CHARS = /[:\\/?*[\]]/g;

function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(INVALID_SHEET_CHARS, "_").trim();
  const base = cleaned.length > 0 ? cleaned : "Sheet";
  return base.length > 31 ? base.slice(0, 31) : base;
}

function excelTypeForValue(v: string | number | boolean): "s" | "n" | "b" {
  if (typeof v === "string") return "s";
  if (typeof v === "boolean") return "b";
  return "n";
}

function cellToSheetObject(cell: Cell): CellObject {
  switch (cell.type) {
    case "string":
      return { t: "s", v: cell.value, w: cell.value };
    case "number":
      return { t: "n", v: cell.value };
    case "boolean":
      return { t: "b", v: cell.value };
    case "formula": {
      const t = excelTypeForValue(cell.value);
      if (t === "s") {
        const s = cell.value as string;
        return { f: cell.formula, t: "s", v: s, w: s };
      }
      if (t === "b") {
        return { f: cell.formula, t: "b", v: cell.value as boolean };
      }
      return { f: cell.formula, t: "n", v: cell.value as number };
    }
    default: {
      const _n: never = cell;
      return _n;
    }
  }
}

function computeRefFromAddresses(addresses: string[]): string {
  if (addresses.length === 0) return "A1";
  let minR = Infinity;
  let maxR = -Infinity;
  let minC = Infinity;
  let maxC = -Infinity;
  for (const addr of addresses) {
    const { row, col } = decodeA1(addr);
    minR = Math.min(minR, row);
    maxR = Math.max(maxR, row);
    minC = Math.min(minC, col);
    maxC = Math.max(maxC, col);
  }
  return XLSX.utils.encode_range({
    s: { r: minR, c: minC },
    e: { r: maxR, c: maxC },
  });
}

function buildSheet(sheet: { name: string; cells: Readonly<Record<string, Cell>> }): WorkSheet {
  const ws: WorkSheet = {};
  const keys = Object.keys(sheet.cells);
  for (const addr of keys) {
    const cell = sheet.cells[addr];
    if (!cell) continue;
    ws[addr] = cellToSheetObject(cell);
  }
  ws["!ref"] = computeRefFromAddresses(keys);
  return ws;
}

/**
 * Serialize a canonical {@link Workbook} to an XLSX byte array (SheetJS).
 * Validates with {@link workbookEncodeSchema} first.
 */
export function workbookToXlsxBuffer(workbook: Workbook): WorkbookToXlsxResult {
  const parsed = workbookEncodeSchema.safeParse(workbook);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    return { ok: false, error: `AST validation failed: ${msg}` };
  }

  try {
    const wb: WorkBook = XLSX.utils.book_new();
    const { sheets } = parsed.data;

    if (sheets.length === 0) {
      const empty: WorkSheet = {};
      empty["!ref"] = "A1";
      XLSX.utils.book_append_sheet(wb, empty, "Sheet1");
    } else {
      const usedNames = new Set<string>();
      for (const sheet of sheets) {
        let name = sanitizeSheetName(sheet.name);
        let n = 2;
        while (usedNames.has(name)) {
          const suffix = ` (${n})`;
          const stem = sheet.name.slice(0, Math.max(1, 31 - suffix.length));
          name = sanitizeSheetName(stem + suffix);
          n++;
        }
        usedNames.add(name);
        XLSX.utils.book_append_sheet(wb, buildSheet(sheet), name);
      }
    }

    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    if (out instanceof ArrayBuffer) return { ok: true, buffer: out };
    if (out instanceof Uint8Array) {
      return { ok: true, buffer: new Uint8Array(out).slice().buffer };
    }
    if (Array.isArray(out)) {
      const u8 = Uint8Array.from(out);
      return { ok: true, buffer: u8.slice().buffer };
    }
    return { ok: false, error: "Unexpected XLSX.write output type." };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Failed to build XLSX: ${msg}` };
  }
}
