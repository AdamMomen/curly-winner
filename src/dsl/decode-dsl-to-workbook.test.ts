import { describe, expect, it } from "vitest";

import type { Workbook } from "@/types";

import { decodeDslToWorkbook } from "./decode-dsl-to-workbook";
import { encodeWorkbookToDsl } from "./encode-workbook-to-dsl";
import {
  XLSXDSL1_EXAMPLE_EMPTY_WORKBOOK,
  XLSXDSL1_EXAMPLE_MINIMAL,
  XLSXDSL1_EXAMPLE_MULTI_SHEET,
  XLSXDSL1_EXAMPLE_SPARSE,
} from "./xlsx-dsl1-examples";

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

describe("decodeDslToWorkbook", () => {
  it("decodes minimal example", () => {
    const r = decodeDslToWorkbook(XLSXDSL1_EXAMPLE_MINIMAL);
    expect(r).toEqual({ ok: true, workbook: workbookMinimal() });
  });

  it("decodes multi-sheet example", () => {
    const r = decodeDslToWorkbook(XLSXDSL1_EXAMPLE_MULTI_SHEET);
    expect(r).toEqual({ ok: true, workbook: workbookMulti() });
  });

  it("decodes sparse example", () => {
    const r = decodeDslToWorkbook(XLSXDSL1_EXAMPLE_SPARSE);
    expect(r).toEqual({ ok: true, workbook: workbookSparse() });
  });

  it("decodes empty workbook", () => {
    const r = decodeDslToWorkbook(XLSXDSL1_EXAMPLE_EMPTY_WORKBOOK);
    expect(r).toEqual({ ok: true, workbook: { sheets: [] } });
  });

  it("normalizes CRLF", () => {
    const crlf = XLSXDSL1_EXAMPLE_MINIMAL.replace(/\n/g, "\r\n");
    const r = decodeDslToWorkbook(crlf);
    expect(r).toEqual({ ok: true, workbook: workbookMinimal() });
  });

  it("round-trips encode → decode", () => {
    const wb = workbookSparse();
    const enc = encodeWorkbookToDsl(wb);
    expect(enc.ok).toBe(true);
    if (!enc.ok) return;
    const dec = decodeDslToWorkbook(enc.dsl);
    expect(dec).toEqual({ ok: true, workbook: wb });
  });

  it("rejects empty input", () => {
    const r = decodeDslToWorkbook("");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]?.line).toBe(1);
    expect(r.errors[0]?.message).toContain("header");
  });

  it("rejects wrong header", () => {
    const r = decodeDslToWorkbook("XLSXDSL1 v2\n");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]?.line).toBe(1);
  });

  it("rejects --- before any sheet", () => {
    const r = decodeDslToWorkbook(`XLSXDSL1 v1

---
`);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.message.includes("without an open sheet"))).toBe(true);
  });

  it("rejects invalid cell line", () => {
    const r = decodeDslToWorkbook(`XLSXDSL1 v1

sheet S
not-a-cell
`);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.sheet === "S" && e.message.includes("invalid cell"))).toBe(
      true,
    );
  });

  it("rejects duplicate address in sheet", () => {
    const r = decodeDslToWorkbook(`XLSXDSL1 v1

sheet S
A1 s:"a"
A1 s:"b"
`);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.message.includes("duplicate"))).toBe(true);
  });

  it("rejects s: payload that is not a JSON string", () => {
    const r = decodeDslToWorkbook(`XLSXDSL1 v1

sheet S
A1 s:1
`);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.message.includes("JSON string"))).toBe(true);
  });

  it("rejects invalid boolean payload", () => {
    const r = decodeDslToWorkbook(`XLSXDSL1 v1

sheet S
A1 b:TRUE
`);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.message.includes("boolean"))).toBe(true);
  });

  it("decodes JSON sheet name", () => {
    const dsl = `XLSXDSL1 v1

sheet "weird\\"name"
A1 s:"x"
`;
    const r = decodeDslToWorkbook(dsl);
    expect(r).toEqual({
      ok: true,
      workbook: {
        sheets: [
          {
            name: 'weird"name',
            cells: { A1: { address: "A1", type: "string", value: "x" } },
          },
        ],
      },
    });
  });
});
