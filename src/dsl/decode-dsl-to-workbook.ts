/**
 * XLSXDSL1 v1 → canonical Workbook (spec: docs/xlsx-dsl1-spec.md).
 */

import { workbookEncodeSchema } from "@/lib/schemas";
import type { Cell, Sheet, Workbook } from "@/types";

const HEADER = "XLSXDSL1 v1";
const CELL_LINE = /^([A-Z]+[1-9][0-9]*)\s+(s|n|b):(.+)$/;
const ADDRESS = /^[A-Z]+[1-9][0-9]*$/;
const SEPARATOR = /^---\s*$/;

export type DecoderError = {
  readonly line?: number;
  readonly sheet?: string;
  readonly message: string;
};

export type DecodeDslToWorkbookResult =
  | { ok: true; workbook: Workbook }
  | { ok: false; errors: readonly DecoderError[] };

type Line = { readonly n: number; readonly s: string };

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function parseSheetName(
  rest: string,
): { ok: true; name: string } | { ok: false; message: string } {
  const trimmedStart = rest.replace(/^\s+/, "");
  if (trimmedStart.startsWith('"')) {
    try {
      const parsed = JSON.parse(trimmedStart) as unknown;
      if (typeof parsed !== "string") {
        return { ok: false, message: "sheet JSON name must be a string" };
      }
      return { ok: true, name: parsed };
    } catch {
      return { ok: false, message: "invalid JSON string in sheet name" };
    }
  }
  return { ok: true, name: rest.replace(/\s+$/, "") };
}

function parseCellValue(
  address: string,
  kind: "s" | "n" | "b",
  payload: string,
): { ok: true; cell: Cell } | { ok: false; message: string } {
  if (kind === "b") {
    if (payload === "true") {
      return { ok: true, cell: { address, type: "boolean", value: true } };
    }
    if (payload === "false") {
      return { ok: true, cell: { address, type: "boolean", value: false } };
    }
    return { ok: false, message: "boolean payload must be true or false" };
  }
  try {
    const v = JSON.parse(payload) as unknown;
    if (kind === "s") {
      if (typeof v !== "string") {
        return { ok: false, message: "s: payload must be a JSON string" };
      }
      return { ok: true, cell: { address, type: "string", value: v } };
    }
    if (typeof v !== "number" || !Number.isFinite(v)) {
      return { ok: false, message: "n: payload must be a finite JSON number" };
    }
    return { ok: true, cell: { address, type: "number", value: v } };
  } catch {
    return { ok: false, message: `invalid JSON for ${kind}:` };
  }
}

/**
 * Parse XLSXDSL1 v1 text into a canonical {@link Workbook}.
 * Fails closed: no partial AST on invalid input. Successful output is validated with {@link workbookEncodeSchema}.
 */
export function decodeDslToWorkbook(dsl: string): DecodeDslToWorkbookResult {
  const errors: DecoderError[] = [];

  if (dsl.trim() === "") {
    return { ok: false, errors: [{ line: 1, message: 'expected header line "XLSXDSL1 v1"' }] };
  }

  const normalized = normalizeNewlines(dsl);
  const rawLines = normalized.split("\n");
  const lines: Line[] = rawLines.map((s, i) => ({ n: i + 1, s }));

  if (lines.length === 0 || lines[0]!.s !== HEADER) {
    errors.push({ line: 1, message: 'first line must be exactly "XLSXDSL1 v1"' });
    return { ok: false, errors };
  }

  let i = 1;
  while (i < lines.length && lines[i]!.s.trim() === "") i++;

  if (i >= lines.length) {
    const empty: Workbook = { sheets: [] };
    const zEmpty = workbookEncodeSchema.safeParse(empty);
    if (!zEmpty.success) {
      return {
        ok: false,
        errors: zEmpty.error.issues.map((iss) => ({
          message: `AST validation failed: ${iss.path.join(".")}: ${iss.message}`,
        })),
      };
    }
    return { ok: true, workbook: zEmpty.data };
  }

  const blocks: Line[][] = [];
  let current: Line[] = [];

  for (; i < lines.length; i++) {
    const line = lines[i]!;
    if (SEPARATOR.test(line.s)) {
      if (current.length === 0) {
        errors.push({
          line: line.n,
          message: "sheet separator --- without an open sheet block",
        });
      } else {
        blocks.push(current);
        current = [];
      }
      continue;
    }
    current.push(line);
  }
  if (current.length > 0) {
    blocks.push(current);
  }

  const sheets: Sheet[] = [];

  for (let b = 0; b < blocks.length; b++) {
    const block = blocks[b]!;
    let bi = 0;
    while (bi < block.length && block[bi]!.s.trim() === "") bi++;

    if (bi >= block.length) {
      errors.push({ message: `sheet block ${b + 1}: empty (no sheet header)` });
      continue;
    }

    const headerLine = block[bi]!;
    if (!headerLine.s.startsWith("sheet ")) {
      errors.push({
        line: headerLine.n,
        message: `expected sheet header, got: ${JSON.stringify(headerLine.s)}`,
      });
      continue;
    }

    const namePart = headerLine.s.slice("sheet ".length);
    const nameResult = parseSheetName(namePart);
    if (!nameResult.ok) {
      errors.push({ line: headerLine.n, message: nameResult.message });
      continue;
    }
    const sheetName = nameResult.name;

    const cells: Record<string, Cell> = {};
    const seen = new Set<string>();

    for (let j = bi + 1; j < block.length; j++) {
      const cl = block[j]!;
      if (cl.s.trim() === "") continue;

      const m = cl.s.match(CELL_LINE);
      if (!m) {
        errors.push({
          line: cl.n,
          sheet: sheetName,
          message: "invalid cell line",
        });
        continue;
      }

      const addr = m[1]!;
      if (!ADDRESS.test(addr)) {
        errors.push({ line: cl.n, sheet: sheetName, message: `bad address ${addr}` });
        continue;
      }

      const kind = m[2] as "s" | "n" | "b";
      const payload = m[3]!;
      if (seen.has(addr)) {
        errors.push({ line: cl.n, sheet: sheetName, message: `duplicate cell ${addr}` });
        continue;
      }

      const parsed = parseCellValue(addr, kind, payload);
      if (!parsed.ok) {
        errors.push({
          line: cl.n,
          sheet: sheetName,
          message: `${addr}: ${parsed.message}`,
        });
        continue;
      }

      seen.add(addr);
      cells[addr] = parsed.cell;
    }

    sheets.push({ name: sheetName, cells });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const workbook: Workbook = { sheets };
  const z = workbookEncodeSchema.safeParse(workbook);
  if (!z.success) {
    return {
      ok: false,
      errors: z.error.issues.map((iss) => ({
        message: `${iss.path.join(".")}: ${iss.message}`,
      })),
    };
  }

  return { ok: true, workbook: z.data };
}
