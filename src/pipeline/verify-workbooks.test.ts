import { describe, expect, it } from "vitest";

import type { Workbook } from "@/types";

import { verificationResultSchema } from "@/lib/schemas";

import { decodeDslToWorkbook } from "@/dsl/decode-dsl-to-workbook";
import { encodeWorkbookToDsl } from "@/dsl/encode-workbook-to-dsl";

import { verifyWorkbooks } from "./verify-workbooks";

const wbA = (): Workbook => ({
  sheets: [
    {
      name: "S1",
      cells: {
        A1: { address: "A1", type: "string", value: "x" },
        B2: { address: "B2", type: "number", value: 1 },
      },
    },
  ],
});

describe("verifyWorkbooks", () => {
  it("returns ok when workbooks are identical", () => {
    const w = wbA();
    const r = verifyWorkbooks(w, w);
    expect(r.ok).toBe(true);
    expect(r.diffs).toHaveLength(0);
    expect(r.summary).toContain("OK");
    expect(() => verificationResultSchema.parse(r)).not.toThrow();
  });

  it("detects sheet count mismatch", () => {
    const a: Workbook = { sheets: [{ name: "A", cells: {} }] };
    const b: Workbook = {
      sheets: [
        { name: "A", cells: {} },
        { name: "B", cells: {} },
      ],
    };
    const r = verifyWorkbooks(a, b);
    expect(r.ok).toBe(false);
    expect(r.diffs.some((d) => d.kind === "sheet_count_mismatch")).toBe(true);
    expect(r.diffs.some((d) => d.kind === "extra_sheet_in_reconstructed")).toBe(true);
    expect(r.summary).toContain("sheet count");
  });

  it("detects sheet name mismatch at same index", () => {
    const a: Workbook = { sheets: [{ name: "One", cells: {} }] };
    const b: Workbook = { sheets: [{ name: "Two", cells: {} }] };
    const r = verifyWorkbooks(a, b);
    expect(r.diffs).toEqual([
      {
        kind: "sheet_name_mismatch",
        index: 0,
        expected: "One",
        actual: "Two",
      },
    ]);
  });

  it("detects missing cell in reconstructed", () => {
    const a: Workbook = {
      sheets: [{ name: "S", cells: { A1: { address: "A1", type: "string", value: "v" } } }],
    };
    const b: Workbook = { sheets: [{ name: "S", cells: {} }] };
    const r = verifyWorkbooks(a, b);
    expect(r.diffs).toEqual([
      {
        kind: "missing_in_reconstructed",
        sheetName: "S",
        address: "A1",
        expected: "v",
      },
    ]);
  });

  it("detects extra cell in reconstructed", () => {
    const a: Workbook = { sheets: [{ name: "S", cells: {} }] };
    const b: Workbook = {
      sheets: [{ name: "S", cells: { A1: { address: "A1", type: "boolean", value: true } } }],
    };
    const r = verifyWorkbooks(a, b);
    expect(r.diffs).toEqual([
      {
        kind: "missing_in_original",
        sheetName: "S",
        address: "A1",
        actual: true,
      },
    ]);
  });

  it("detects value mismatch", () => {
    const a: Workbook = {
      sheets: [{ name: "S", cells: { A1: { address: "A1", type: "number", value: 1 } } }],
    };
    const b: Workbook = {
      sheets: [{ name: "S", cells: { A1: { address: "A1", type: "number", value: 2 } } }],
    };
    const r = verifyWorkbooks(a, b);
    expect(r.diffs).toEqual([
      {
        kind: "value_mismatch",
        sheetName: "S",
        address: "A1",
        expected: 1,
        actual: 2,
      },
    ]);
  });

  it("detects formula mismatch", () => {
    const a: Workbook = {
      sheets: [
        {
          name: "S",
          cells: {
            A1: { address: "A1", type: "formula", formula: "1+1", value: 2 },
          },
        },
      ],
    };
    const b: Workbook = {
      sheets: [
        {
          name: "S",
          cells: {
            A1: { address: "A1", type: "formula", formula: "2+2", value: 2 },
          },
        },
      ],
    };
    const r = verifyWorkbooks(a, b);
    expect(r.diffs).toEqual([
      {
        kind: "formula_mismatch",
        sheetName: "S",
        address: "A1",
        expectedFormula: "1+1",
        actualFormula: "2+2",
      },
    ]);
  });

  it("detects cell type mismatch", () => {
    const a: Workbook = {
      sheets: [{ name: "S", cells: { A1: { address: "A1", type: "string", value: "1" } } }],
    };
    const b: Workbook = {
      sheets: [{ name: "S", cells: { A1: { address: "A1", type: "number", value: 1 } } }],
    };
    const r = verifyWorkbooks(a, b);
    expect(r.diffs).toEqual([
      {
        kind: "cell_type_mismatch",
        sheetName: "S",
        address: "A1",
        expectedType: "string",
        actualType: "number",
      },
    ]);
  });

  it("matches DSL encode → decode round-trip", () => {
    const w = wbA();
    const enc = encodeWorkbookToDsl(w);
    expect(enc.ok).toBe(true);
    if (!enc.ok) return;
    const dec = decodeDslToWorkbook(enc.dsl);
    expect(dec.ok).toBe(true);
    if (!dec.ok) return;
    const r = verifyWorkbooks(w, dec.workbook);
    expect(r).toMatchObject({ ok: true, diffs: [] });
  });
});
