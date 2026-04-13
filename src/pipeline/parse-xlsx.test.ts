import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";

import {
  countWorkbookCells,
  parseXlsxBuffer,
  parseXlsxFile,
} from "./parse-xlsx";

function writeWorkbook(wb: XLSX.WorkBook): ArrayBuffer {
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  if (out instanceof ArrayBuffer) return out;
  if (Array.isArray(out)) {
    return Uint8Array.from(out).buffer;
  }
  if (out instanceof Uint8Array) {
    return new Uint8Array(out).buffer;
  }
  throw new Error("Unexpected XLSX.write output");
}

describe("parseXlsxBuffer", () => {
  it("parses a simple single-sheet workbook", () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["hello", 42, true],
      [null, null, 3.14],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = writeWorkbook(wb);
    const r = parseXlsxBuffer(buf);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.workbook.sheets).toHaveLength(1);
    expect(r.workbook.sheets[0].name).toBe("Sheet1");
    expect(r.workbook.sheets[0].cells.A1).toMatchObject({
      type: "string",
      value: "hello",
    });
    expect(r.workbook.sheets[0].cells.B1).toMatchObject({
      type: "number",
      value: 42,
    });
    expect(r.workbook.sheets[0].cells.C1).toMatchObject({
      type: "boolean",
      value: true,
    });
    expect(r.workbook.sheets[0].cells.C2).toMatchObject({
      type: "number",
      value: 3.14,
    });
    expect(r.workbook.sheets[0].cells.A2).toBeUndefined();
  });

  it("preserves multi-sheet order", () => {
    const wb = XLSX.utils.book_new();
    const a = XLSX.utils.aoa_to_sheet([[1]]);
    const b = XLSX.utils.aoa_to_sheet([[2]]);
    XLSX.utils.book_append_sheet(wb, a, "First");
    XLSX.utils.book_append_sheet(wb, b, "Second");
    const r = parseXlsxBuffer(writeWorkbook(wb));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.workbook.sheets.map((s) => s.name)).toEqual(["First", "Second"]);
    expect(r.workbook.sheets[0].cells.A1?.value).toBe(1);
    expect(r.workbook.sheets[1].cells.A1?.value).toBe(2);
  });

  it("handles sparse layout (gaps in range)", () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);
    ws["A1"] = { t: "n", v: 1 };
    ws["D4"] = { t: "n", v: 99 };
    ws["!ref"] = "A1:D4";
    XLSX.utils.book_append_sheet(wb, ws, "Sparse");
    const r = parseXlsxBuffer(writeWorkbook(wb));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const cells = r.workbook.sheets[0].cells;
    expect(cells.A1).toMatchObject({ type: "number", value: 1 });
    expect(cells.D4).toMatchObject({ type: "number", value: 99 });
    expect(cells.B2).toBeUndefined();
  });

  it("is deterministic for the same buffer", () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["a", "b"],
        ["c", "d"],
      ]),
      "S"
    );
    const buf = writeWorkbook(wb);
    const a = parseXlsxBuffer(buf);
    const b = parseXlsxBuffer(buf);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(JSON.stringify(a.workbook)).toBe(JSON.stringify(b.workbook));
    }
  });

  it("fails for truncated / corrupt xlsx bytes", () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[1]]), "S");
    const full = writeWorkbook(wb);
    const truncated = full.slice(0, 20);
    const r = parseXlsxBuffer(truncated);
    expect(r.ok).toBe(false);
  });

  it("counts cells", () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([[1, 2]]),
      "S"
    );
    const r = parseXlsxBuffer(writeWorkbook(wb));
    expect(r.ok).toBe(true);
    if (r.ok) expect(countWorkbookCells(r.workbook)).toBe(2);
  });
});

describe("parseXlsxFile", () => {
  it("parses a File", async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["x"]]), "S");
    const buf = writeWorkbook(wb);
    const file = new File([buf], "t.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const r = await parseXlsxFile(file);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.workbook.sheets[0].cells.A1?.value).toBe("x");
    }
  });
});
