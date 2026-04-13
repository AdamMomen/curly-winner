import { decodeA1 } from "@/lib/a1";
import { workbookEncodeSchema } from "@/lib/schemas";
import type { Cell, Workbook } from "@/types";

const HEADER = "XLSXDSL1 v1";

export type EncodeWorkbookToDslResult =
  | { ok: true; dsl: string }
  | { ok: false; error: string };

/** Sheet line: bare `sheet Name` or `sheet` + JSON.stringify when needed (spec §6). */
export function encodeSheetNameLine(name: string): string {
  const trimmed = name.trim();
  const safeBare =
    name.length > 0 &&
    name === trimmed &&
    !name.startsWith('"') &&
    !/[\u0000-\u001f\u007f]/.test(name);
  if (safeBare) {
    return `sheet ${name}`;
  }
  return `sheet ${JSON.stringify(name)}`;
}

function compareRowMajorAddresses(a: string, b: string): number {
  const da = decodeA1(a);
  const db = decodeA1(b);
  if (da.row !== db.row) return da.row - db.row;
  return da.col - db.col;
}

function encodeCellLine(cell: Cell): string {
  const { address } = cell;
  switch (cell.type) {
    case "string":
      return `${address} s:${JSON.stringify(cell.value)}`;
    case "number":
      return `${address} n:${JSON.stringify(cell.value)}`;
    case "boolean":
      return `${address} b:${cell.value ? "true" : "false"}`;
    default: {
      const _x: never = cell;
      return _x;
    }
  }
}

/**
 * Serialize a canonical {@link Workbook} to XLSXDSL1 v1 text.
 * Validates with {@link workbookEncodeSchema} before encoding.
 */
export function encodeWorkbookToDsl(workbook: Workbook): EncodeWorkbookToDslResult {
  const parsed = workbookEncodeSchema.safeParse(workbook);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    return { ok: false, error: `AST validation failed: ${msg}` };
  }

  const { sheets } = parsed.data;

  if (sheets.length === 0) {
    return { ok: true, dsl: `${HEADER}\n` };
  }

  const lines: string[] = [HEADER, ""];

  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i]!;
    if (i > 0) {
      lines.push("");
      lines.push("---");
      lines.push("");
    }
    lines.push(encodeSheetNameLine(sheet.name));
    const addresses = Object.keys(sheet.cells).sort(compareRowMajorAddresses);
    for (const addr of addresses) {
      const cell = sheet.cells[addr];
      if (cell) lines.push(encodeCellLine(cell));
    }
  }

  return { ok: true, dsl: `${lines.join("\n")}\n` };
}
