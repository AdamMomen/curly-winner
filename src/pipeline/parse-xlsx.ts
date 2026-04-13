import * as XLSX from "xlsx";
import type { CellObject, WorkBook, WorkSheet } from "xlsx";

import { workbookSchema } from "@/lib/schemas";
import type { Cell, Sheet, Workbook } from "@/types";

export type ParseXlsxResult =
  | { ok: true; workbook: Workbook }
  | { ok: false; error: string };

/**
 * Read an XLSX workbook from bytes and produce the canonical {@link Workbook} AST.
 * Output is validated with Zod before returning.
 */
export function parseXlsxBuffer(buffer: ArrayBuffer): ParseXlsxResult {
  try {
    const wb = XLSX.read(buffer, {
      type: "array",
      cellDates: true,
      dense: false,
    });

    if (!wb.SheetNames?.length) {
      return { ok: false, error: "Workbook has no sheets." };
    }

    const sheets: Sheet[] = [];
    for (const name of wb.SheetNames) {
      const ws = wb.Sheets[name];
      if (!ws) {
        return { ok: false, error: `Missing worksheet data for "${name}".` };
      }
      sheets.push(parseWorksheet(ws, name, wb));
    }

    const candidate = { sheets };
    const parsed = workbookSchema.safeParse(candidate);
    if (!parsed.success) {
      const msg = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return { ok: false, error: `AST validation failed: ${msg}` };
    }

    return { ok: true, workbook: parsed.data as Workbook };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Failed to parse XLSX: ${msg}` };
  }
}

/** Parse from a browser {@link File}. */
export async function parseXlsxFile(file: File): Promise<ParseXlsxResult> {
  const buffer = await file.arrayBuffer();
  return parseXlsxBuffer(buffer);
}

/** Total non-empty cells across all sheets (sparse map size). */
export function countWorkbookCells(workbook: Workbook): number {
  return workbook.sheets.reduce(
    (n, sheet) => n + Object.keys(sheet.cells).length,
    0
  );
}

function parseWorksheet(ws: WorkSheet, sheetName: string, wb: WorkBook): Sheet {
  const cells: Record<string, Cell> = {};
  const ref = ws["!ref"];
  if (!ref) {
    return { name: sheetName, cells };
  }

  const range = XLSX.utils.decode_range(ref);
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addrRaw = XLSX.utils.encode_cell({ r: R, c: C });
      const addr = addrRaw.toUpperCase();
      const raw = ws[addr] ?? ws[addrRaw];
      const cell = raw as CellObject | undefined;
      if (!cell) continue;

      const normalized = normalizeCell(cell, wb);
      if (normalized == null) continue;

      cells[addr] = { ...normalized, address: addr } as Cell;
    }
  }

  return { name: sheetName, cells };
}

function normalizeCell(
  cell: CellObject,
  wb: WorkBook
): Omit<Cell, "address"> | null {
  switch (cell.t) {
    case "z":
      return null;
    case "b": {
      const v = cell.v;
      const truthy =
        v === true ||
        v === 1 ||
        (typeof v === "string" && v.toUpperCase() === "TRUE");
      return { type: "boolean", value: truthy };
    }
    case "n": {
      if (typeof cell.v !== "number" || !Number.isFinite(cell.v)) {
        return null;
      }
      return { type: "number", value: cell.v };
    }
    case "d": {
      if (cell.v instanceof Date) {
        return { type: "string", value: cell.v.toISOString() };
      }
      if (typeof cell.v === "number" && Number.isFinite(cell.v)) {
        return { type: "number", value: cell.v };
      }
      return null;
    }
    case "e": {
      const text =
        typeof cell.w === "string" && cell.w.length > 0
          ? cell.w
          : typeof cell.v === "string"
            ? cell.v
            : "#ERROR?";
      return { type: "string", value: text };
    }
    case "s": {
      const text = resolveSharedString(cell, wb);
      return { type: "string", value: text };
    }
    default:
      return null;
  }
}

function resolveSharedString(cell: CellObject, wb: WorkBook): string {
  if (typeof cell.w === "string" && cell.w.length > 0) {
    return cell.w;
  }
  if (typeof cell.v === "string") {
    return cell.v;
  }
  if (typeof cell.v === "number") {
    const table = (wb as unknown as { SS?: { t?: string }[] | string[] }).SS;
    if (Array.isArray(table)) {
      const entry = table[cell.v];
      if (typeof entry === "string") return entry;
      if (entry && typeof entry === "object" && "t" in entry) {
        return String(entry.t ?? "");
      }
    }
  }
  return "";
}
