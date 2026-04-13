import { describe, expect, it } from "vitest";

import { parseXlsxBuffer } from "@/pipeline/parse-xlsx";
import { runPipelineStages } from "@/pipeline/run-pipeline";
import { workbookToXlsxBuffer } from "@/pipeline/workbook-to-xlsx";
import type { Workbook } from "@/types";

import {
  FIXTURE_EMPTY_SHEET,
  FIXTURE_LONG_STRING,
  FIXTURE_MIXED_PRIMITIVES,
  FIXTURE_MULTI_SHEET,
  FIXTURE_SHEET_NAME_ESCAPED,
  FIXTURE_SMALL,
  FIXTURE_SPARSE,
  FIXTURE_STRING_SPECIAL_CHARS,
  FIXTURE_ZERO_SHEETS,
  REPRESENTATIVE_FIXTURES,
} from "./workbooks";

function assertPipelineVerifies(wb: Workbook): void {
  const r = runPipelineStages(wb);
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.verification.ok).toBe(true);
}

function assertParseEncodeDecodeVerifyViaXlsx(wb: Workbook): void {
  const x = workbookToXlsxBuffer(wb);
  expect(x.ok, x.ok ? "" : x.error).toBe(true);
  if (!x.ok) return;
  const p = parseXlsxBuffer(x.buffer);
  expect(p.ok, p.ok ? "" : p.error).toBe(true);
  if (!p.ok) return;
  const r = runPipelineStages(p.workbook);
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.verification.ok).toBe(true);
}

describe("Phase 17.1 — representative AST fixtures", () => {
  it.each(REPRESENTATIVE_FIXTURES)(
    "%s: runPipelineStages verifies",
    (_label, wb) => {
      assertPipelineVerifies(wb);
    },
  );
});

describe("Phase 17.2 — parse → encode → decode → verify (via binary XLSX)", () => {
  it.each([
    ["small", FIXTURE_SMALL],
    ["multi_sheet", FIXTURE_MULTI_SHEET],
    ["sparse", FIXTURE_SPARSE],
    ["empty_sheet", FIXTURE_EMPTY_SHEET],
  ] as const)("%s: SheetJS write → parseXlsxBuffer → pipeline", (_label, wb) => {
    assertParseEncodeDecodeVerifyViaXlsx(wb);
  });

  it("mixed primitives (incl. formula): binary round-trip", () => {
    assertParseEncodeDecodeVerifyViaXlsx(FIXTURE_MIXED_PRIMITIVES);
  });

  it("long string: binary round-trip", () => {
    assertParseEncodeDecodeVerifyViaXlsx(FIXTURE_LONG_STRING);
  });

  it("JSON-escaped sheet name: binary round-trip", () => {
    assertParseEncodeDecodeVerifyViaXlsx(FIXTURE_SHEET_NAME_ESCAPED);
  });

  it("special characters in string cell: binary round-trip", () => {
    assertParseEncodeDecodeVerifyViaXlsx(FIXTURE_STRING_SPECIAL_CHARS);
  });
});

describe("Phase 17.3 — edge cases", () => {
  it("zero-sheet workbook encodes and verifies through DSL", () => {
    assertPipelineVerifies(FIXTURE_ZERO_SHEETS);
  });

  it("sheet with no occupied cells verifies", () => {
    assertPipelineVerifies(FIXTURE_EMPTY_SHEET);
  });

  it("sheet name that is not DSL-bare-safe still verifies", () => {
    assertPipelineVerifies(FIXTURE_SHEET_NAME_ESCAPED);
  });

  it("long Unicode string verifies (AST-only path also covered in 17.2)", () => {
    assertPipelineVerifies(FIXTURE_LONG_STRING);
  });

  it("string payload with quotes, newline, backslash, tab verifies", () => {
    assertPipelineVerifies(FIXTURE_STRING_SPECIAL_CHARS);
  });

  it("sparse layout: gap addresses are absent from the cell map", () => {
    const r = runPipelineStages(FIXTURE_SPARSE);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const cells = r.workbook.sheets[0].cells;
    expect(cells.B2).toBeUndefined();
    expect(cells.D4).toMatchObject({ type: "number", value: 99 });
  });
});
