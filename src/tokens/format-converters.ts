import { colIndexToLetters, decodeA1, encodeA1 } from "@/lib/a1";
import { formatCellDisplay, getSheetBounds } from "@/lib/grid-bounds";
import type { Cell, CellValue, Workbook } from "@/types";

function sortRowMajorAddresses(addresses: readonly string[]): string[] {
  return [...addresses].sort((a, b) => {
    const da = decodeA1(a);
    const db = decodeA1(b);
    if (da.row !== db.row) return da.row - db.row;
    return da.col - db.col;
  });
}

function cellToJsonPayload(cell: Cell): Record<string, unknown> {
  if (cell.type === "formula") {
    return {
      address: cell.address,
      type: cell.type,
      formula: cell.formula,
      value: cell.value,
    };
  }
  return { address: cell.address, type: cell.type, value: cell.value };
}

/**
 * Compact, deterministic JSON for the workbook (sheet order preserved; cell keys row-major).
 */
export function astToCanonicalJson(workbook: Workbook): string {
  const payload = {
    sheets: workbook.sheets.map((sheet) => ({
      name: sheet.name,
      cells: Object.fromEntries(
        sortRowMajorAddresses(Object.keys(sheet.cells)).map((addr) => {
          const cell = sheet.cells[addr]!;
          return [addr, cellToJsonPayload(cell)];
        }),
      ),
    })),
  };
  return JSON.stringify(payload);
}

function escapeCsvField(field: string): string {
  if (/[",\n\r]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function sheetToCsvBlock(sheet: { name: string; cells: Readonly<Record<string, Cell>> }): string {
  const bounds = getSheetBounds(sheet);
  const headerLine = `=== ${sheet.name} ===`;
  if (!bounds) {
    return headerLine;
  }
  const colLabels = [""];
  for (let c = bounds.minCol; c <= bounds.maxCol; c++) {
    colLabels.push(colIndexToLetters(c));
  }
  const lines: string[] = [headerLine, colLabels.map(escapeCsvField).join(",")];
  for (let r = bounds.minRow; r <= bounds.maxRow; r++) {
    const row: string[] = [String(r + 1)];
    for (let c = bounds.minCol; c <= bounds.maxCol; c++) {
      const addr = encodeA1(r, c);
      const cell = sheet.cells[addr];
      row.push(cell ? formatCellDisplay(cell) : "");
    }
    lines.push(row.map(escapeCsvField).join(","));
  }
  return lines.join("\n");
}

/**
 * Multi-sheet CSV: each sheet starts with `=== name ===`, then a dense rectangle CSV for occupied bounds.
 */
export function astToCsvText(workbook: Workbook): string {
  if (workbook.sheets.length === 0) return "";
  return workbook.sheets.map((s) => sheetToCsvBlock(s)).join("\n\n");
}

function xmlEscapeText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function xmlEscapeAttr(s: string): string {
  return xmlEscapeText(s).replace(/"/g, "&quot;");
}

function cellTypeAttr(cell: Cell): string {
  switch (cell.type) {
    case "string":
      return "s";
    case "number":
      return "n";
    case "boolean":
      return "b";
    case "formula":
      return "f";
    default: {
      const _x: never = cell;
      return _x;
    }
  }
}

function primitiveValueXml(value: CellValue): string {
  const raw =
    typeof value === "string"
      ? value
      : typeof value === "number"
        ? String(value)
        : value
          ? "true"
          : "false";
  return xmlEscapeText(raw);
}

function cellValueXml(cell: Cell): string {
  if (cell.type === "formula") {
    return primitiveValueXml(cell.value);
  }
  const raw =
    cell.type === "string"
      ? cell.value
      : cell.type === "number"
        ? String(cell.value)
        : cell.value
          ? "true"
          : "false";
  return xmlEscapeText(raw);
}

/**
 * Simplified XML workbook (not OOXML-compatible). Occupied cells only, row-major order.
 */
export function astToApproxXmlText(workbook: Workbook): string {
  const parts: string[] = ["<workbook>"];
  for (const sheet of workbook.sheets) {
    parts.push(`<sheet name="${xmlEscapeAttr(sheet.name)}">`);
    for (const addr of sortRowMajorAddresses(Object.keys(sheet.cells))) {
      const cell = sheet.cells[addr];
      if (!cell) continue;
      if (cell.type === "formula") {
        parts.push(
          `<c r="${xmlEscapeAttr(addr)}" t="f" formula="${xmlEscapeAttr(cell.formula)}"><v>${cellValueXml(cell)}</v></c>`,
        );
      } else {
        parts.push(
          `<c r="${xmlEscapeAttr(addr)}" t="${cellTypeAttr(cell)}"><v>${cellValueXml(cell)}</v></c>`,
        );
      }
    }
    parts.push("</sheet>");
  }
  parts.push("</workbook>");
  return parts.join("");
}
