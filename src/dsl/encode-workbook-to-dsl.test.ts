import { describe, expect, it } from "vitest";

import type { Workbook } from "@/types";

import {
  encodeSheetNameLine,
  encodeWorkbookToDsl,
} from "./encode-workbook-to-dsl";
import {
  XLSXDSL1_EXAMPLE_EMPTY_WORKBOOK,
  XLSXDSL1_EXAMPLE_MINIMAL,
  XLSXDSL1_EXAMPLE_MULTI_SHEET,
  XLSXDSL1_EXAMPLE_SPARSE,
} from "./xlsx-dsl1-examples";
import { validateXlsxDsl1 } from "./validate-xlsx-dsl1";

const workbookMinimal = (): Workbook => ({
  sheets: [
    {
      name: "Summary",
      cells: {
        A1: { address: "A1", type: "string", value: "Total" },
        B1: { address: "B1", type: "number", value: 100 },
      },
    },
  ],
});

const workbookMulti = (): Workbook => ({
  sheets: [
    {
      name: "Summary",
      cells: {
        A1: { address: "A1", type: "string", value: "Total" },
      },
    },
    {
      name: "Details",
      cells: {
        Z99: { address: "Z99", type: "boolean", value: true },
      },
    },
  ],
});

const workbookSparse = (): Workbook => ({
  sheets: [
    {
      name: "Data",
      cells: {
        A1: { address: "A1", type: "string", value: "corner" },
        C3: { address: "C3", type: "number", value: -2.5 },
        AA10: { address: "AA10", type: "boolean", value: false },
      },
    },
  ],
});

describe("encodeWorkbookToDsl", () => {
  it("matches golden minimal example", () => {
    const r = encodeWorkbookToDsl(workbookMinimal());
    expect(r).toEqual({ ok: true, dsl: XLSXDSL1_EXAMPLE_MINIMAL });
    if (r.ok) expect(validateXlsxDsl1(r.dsl)).toEqual({ ok: true });
  });

  it("matches golden multi-sheet example", () => {
    const r = encodeWorkbookToDsl(workbookMulti());
    expect(r).toEqual({ ok: true, dsl: XLSXDSL1_EXAMPLE_MULTI_SHEET });
    if (r.ok) expect(validateXlsxDsl1(r.dsl)).toEqual({ ok: true });
  });

  it("matches golden sparse example (row-major cell order)", () => {
    const r = encodeWorkbookToDsl(workbookSparse());
    expect(r).toEqual({ ok: true, dsl: XLSXDSL1_EXAMPLE_SPARSE });
    if (r.ok) expect(validateXlsxDsl1(r.dsl)).toEqual({ ok: true });
  });

  it("encodes empty workbook", () => {
    const r = encodeWorkbookToDsl({ sheets: [] });
    expect(r).toEqual({ ok: true, dsl: XLSXDSL1_EXAMPLE_EMPTY_WORKBOOK });
  });

  it("rejects when cell key does not match address", () => {
    const r = encodeWorkbookToDsl({
      sheets: [
        {
          name: "S",
          cells: {
            A1: { address: "B1", type: "string", value: "x" },
          },
        },
      ],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("AST validation failed");
  });

  it("rejects non-finite numbers", () => {
    const r = encodeWorkbookToDsl({
      sheets: [
        {
          name: "S",
          cells: {
            A1: { address: "A1", type: "number", value: Number.NaN },
          },
        },
      ],
    });
    expect(r.ok).toBe(false);
  });

  it("is deterministic for the same AST", () => {
    const wb = workbookSparse();
    const a = encodeWorkbookToDsl(wb);
    const b = encodeWorkbookToDsl(wb);
    expect(a).toEqual(b);
  });

  it("sorts cells row-major regardless of object key insertion order", () => {
    const wb: Workbook = {
      sheets: [
        {
          name: "S",
          cells: {
            C3: { address: "C3", type: "number", value: 3 },
            A1: { address: "A1", type: "string", value: "a" },
            B2: { address: "B2", type: "boolean", value: false },
          },
        },
      ],
    };
    const r = encodeWorkbookToDsl(wb);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.dsl).toContain("A1 s:\"a\"\nB2 b:false\nC3 n:3");
  });

  it("escapes string cells for JSON", () => {
    const r = encodeWorkbookToDsl({
      sheets: [
        {
          name: "S",
          cells: {
            A1: { address: "A1", type: "string", value: 'line1\nline2"' },
          },
        },
      ],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.dsl).toContain('A1 s:"line1\\nline2\\""');
    expect(validateXlsxDsl1(r.dsl)).toEqual({ ok: true });
  });
});

describe("encodeSheetNameLine", () => {
  it("uses bare form for simple names", () => {
    expect(encodeSheetNameLine("Summary")).toBe("sheet Summary");
  });

  it("uses JSON for leading quote", () => {
    expect(encodeSheetNameLine('"Q1"')).toBe('sheet "\\"Q1\\""');
  });

  it("uses JSON for control characters", () => {
    expect(encodeSheetNameLine("a\nb")).toBe('sheet "a\\nb"');
  });

  it("uses JSON for leading/trailing spaces", () => {
    expect(encodeSheetNameLine(" x ")).toBe('sheet " x "');
  });
});
