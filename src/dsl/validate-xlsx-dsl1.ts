/**
 * Structural validation for XLSXDSL1 v1 (spec: docs/xlsx-dsl1-spec.md).
 * Ensures golden examples and user documents match grammar before encoder/decoder land.
 */

import {
  XLSXDSL1_EXAMPLE_EMPTY_WORKBOOK,
  XLSXDSL1_EXAMPLE_MINIMAL,
  XLSXDSL1_EXAMPLE_MULTI_SHEET,
  XLSXDSL1_EXAMPLE_SPARSE,
} from "./xlsx-dsl1-examples";

const HEADER = "XLSXDSL1 v1";
const CELL_LINE = /^([A-Z]+[1-9][0-9]*)\s+(s|n|b):(.+)$/;
const ADDRESS = /^[A-Z]+[1-9][0-9]*$/;
const SEPARATOR = /^---\s*$/;

export type ValidateXlsxDsl1Result =
  | { ok: true }
  | { ok: false; errors: readonly string[] };

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function parseSheetName(rest: string): { ok: true; name: string } | { ok: false; message: string } {
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

function validateCellPayload(kind: "s" | "n" | "b", payload: string, ctx: string): string | null {
  if (kind === "b") {
    if (payload === "true" || payload === "false") return null;
    return `${ctx}: boolean payload must be true or false`;
  }
  try {
    const v = JSON.parse(payload) as unknown;
    if (kind === "s" && typeof v !== "string") {
      return `${ctx}: s: payload must be a JSON string`;
    }
    if (kind === "n") {
      if (typeof v !== "number" || !Number.isFinite(v)) {
        return `${ctx}: n: payload must be a finite JSON number`;
      }
    }
    return null;
  } catch {
    return `${ctx}: invalid JSON for ${kind}:`;
  }
}

/** Exported for tests: canonical example strings must validate. */
export const CANONICAL_XLSXDSL1_FIXTURES = [
  ["empty workbook", XLSXDSL1_EXAMPLE_EMPTY_WORKBOOK],
  ["minimal", XLSXDSL1_EXAMPLE_MINIMAL],
  ["multi-sheet", XLSXDSL1_EXAMPLE_MULTI_SHEET],
  ["sparse", XLSXDSL1_EXAMPLE_SPARSE],
] as const;

/**
 * Validates workbook structure, sheet headers, separators, and cell lines.
 * Does not build an AST (Phase 7); duplicate-address and ordering checks included.
 */
export function validateXlsxDsl1(text: string): ValidateXlsxDsl1Result {
  const errors: string[] = [];
  const normalized = normalizeNewlines(text);
  const lines = normalized.split("\n");

  if (lines.length === 0 || lines[0] !== HEADER) {
    errors.push('line 1: must be exactly "XLSXDSL1 v1"');
    return { ok: false, errors };
  }

  let i = 1;
  while (i < lines.length && lines[i]!.trim() === "") i++;

  if (i >= lines.length) {
    return { ok: true };
  }

  const sheetBlocks: string[][] = [];
  let current: string[] = [];

  for (; i < lines.length; i++) {
    const line = lines[i]!;
    if (SEPARATOR.test(line)) {
      if (current.length === 0) {
        errors.push(`line ${i + 1}: sheet separator --- without an open sheet block`);
      } else {
        sheetBlocks.push(current);
        current = [];
      }
      continue;
    }
    current.push(line);
  }
  if (current.length > 0) {
    sheetBlocks.push(current);
  }

  for (let s = 0; s < sheetBlocks.length; s++) {
    const block = sheetBlocks[s]!;
    let bi = 0;
    while (bi < block.length && block[bi]!.trim() === "") bi++;
    if (bi >= block.length) {
      errors.push(`sheet block ${s + 1}: empty (no sheet header)`);
      continue;
    }
    const headerLine = block[bi]!;
    if (!headerLine.startsWith("sheet ")) {
      errors.push(`sheet block ${s + 1}: expected sheet header, got: ${JSON.stringify(headerLine)}`);
      continue;
    }
    const namePart = headerLine.slice("sheet ".length);
    const nameResult = parseSheetName(namePart);
    if (!nameResult.ok) {
      errors.push(`sheet block ${s + 1}: ${nameResult.message}`);
      continue;
    }

    const seen = new Set<string>();
    for (let j = bi + 1; j < block.length; j++) {
      const cl = block[j]!;
      if (cl.trim() === "") continue;
      const m = cl.match(CELL_LINE);
      if (!m) {
        errors.push(`sheet "${nameResult.name}" line ${j + 1}: invalid cell line`);
        continue;
      }
      const addr = m[1]!;
      if (!ADDRESS.test(addr)) {
        errors.push(`sheet "${nameResult.name}": bad address ${addr}`);
        continue;
      }
      const kind = m[2] as "s" | "n" | "b";
      const payload = m[3]!;
      const err = validateCellPayload(kind, payload, `sheet "${nameResult.name}" ${addr}`);
      if (err) errors.push(err);
      if (seen.has(addr)) {
        errors.push(`sheet "${nameResult.name}": duplicate cell ${addr}`);
      }
      seen.add(addr);
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true };
}
