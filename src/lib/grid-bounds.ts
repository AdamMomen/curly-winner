import type { Cell, Sheet } from "@/types";

import { decodeA1 } from "./a1";

export type SheetBounds = {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
};

/** Bounding box of all non-empty cells in a sheet (inclusive). */
export function getSheetBounds(sheet: Sheet): SheetBounds | null {
  const keys = Object.keys(sheet.cells);
  if (keys.length === 0) return null;

  let minRow = Infinity;
  let maxRow = -Infinity;
  let minCol = Infinity;
  let maxCol = -Infinity;

  for (const addr of keys) {
    const { row, col } = decodeA1(addr);
    minRow = Math.min(minRow, row);
    maxRow = Math.max(maxRow, row);
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col);
  }

  return { minRow, maxRow, minCol, maxCol };
}

export function formatCellDisplay(cell: Cell): string {
  switch (cell.type) {
    case "boolean":
      return cell.value ? "TRUE" : "FALSE";
    case "number":
      return Number.isInteger(cell.value)
        ? String(cell.value)
        : String(cell.value);
    case "string":
      return cell.value;
  }
}
