import { describe, expect, it } from "vitest";

import type { Workbook } from "@/types";

import { parseXlsxBuffer } from "./parse-xlsx";
import { verifyWorkbooks } from "./verify-workbooks";
import { workbookToXlsxBuffer } from "./workbook-to-xlsx";

const minimal: Workbook = {
  sheets: [
    {
      name: "Summary",
      cells: {
        A1: { address: "A1", type: "string", value: "Total" },
        B1: { address: "B1", type: "number", value: 100 },
      },
    },
  ],
};

describe("workbookToXlsxBuffer", () => {
  it("round-trips a simple workbook through parse", () => {
    const w = workbookToXlsxBuffer(minimal);
    expect(w.ok).toBe(true);
    if (!w.ok) return;
    const p = parseXlsxBuffer(w.buffer);
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    const v = verifyWorkbooks(minimal, p.workbook);
    expect(v.ok).toBe(true);
  });

  it("round-trips formula cells", () => {
    const wb: Workbook = {
      sheets: [
        {
          name: "Calc",
          cells: {
            A1: { address: "A1", type: "number", value: 10 },
            B1: { address: "B1", type: "formula", formula: "A1*2", value: 20 },
          },
        },
      ],
    };
    const w = workbookToXlsxBuffer(wb);
    expect(w.ok).toBe(true);
    if (!w.ok) return;
    const p = parseXlsxBuffer(w.buffer);
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    const v = verifyWorkbooks(wb, p.workbook);
    expect(v.ok).toBe(true);
  });

  it("writes an empty workbook as one blank sheet", () => {
    const w = workbookToXlsxBuffer({ sheets: [] });
    expect(w.ok).toBe(true);
    if (!w.ok) return;
    const p = parseXlsxBuffer(w.buffer);
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(p.workbook.sheets.length).toBeGreaterThanOrEqual(1);
  });

  it("rejects invalid AST", () => {
    const w = workbookToXlsxBuffer({
      sheets: [
        {
          name: "S",
          cells: {
            A1: { address: "B1", type: "string", value: "x" },
          },
        },
      ],
    });
    expect(w.ok).toBe(false);
  });
});
