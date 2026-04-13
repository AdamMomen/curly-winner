import { describe, expect, it } from "vitest";

import {
  XLSX_MIME,
  isXlsxFileName,
  validateXlsxFile,
} from "./xlsx-upload";

describe("isXlsxFileName", () => {
  it("accepts .xlsx case-insensitively", () => {
    expect(isXlsxFileName("Book.xlsx")).toBe(true);
    expect(isXlsxFileName("Book.XLSX")).toBe(true);
  });

  it("rejects other extensions", () => {
    expect(isXlsxFileName("Book.xls")).toBe(false);
    expect(isXlsxFileName("Book.csv")).toBe(false);
    expect(isXlsxFileName("Book.xlsx.backup")).toBe(false);
  });
});

describe("validateXlsxFile", () => {
  it("rejects null/undefined", () => {
    expect(validateXlsxFile(null).ok).toBe(false);
    expect(validateXlsxFile(undefined).ok).toBe(false);
  });

  it("rejects non-xlsx names", () => {
    const csv = new File([""], "data.csv", { type: "text/csv" });
    const r = validateXlsxFile(csv);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/\.xlsx/i);
  });

  it("accepts .xlsx file", () => {
    const x = new File([""], "data.xlsx", { type: XLSX_MIME });
    const r = validateXlsxFile(x);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.file.name).toBe("data.xlsx");
  });
});
