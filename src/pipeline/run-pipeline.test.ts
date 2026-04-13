import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";

import { encodeWorkbookToDsl } from "@/dsl";
import type { Workbook } from "@/types";

import { parseXlsxBuffer } from "./parse-xlsx";
import { runPipeline, runPipelineStages } from "./run-pipeline";

function writeWorkbook(wb: XLSX.WorkBook): ArrayBuffer {
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  if (out instanceof ArrayBuffer) return out;
  if (Array.isArray(out)) return Uint8Array.from(out).buffer;
  if (out instanceof Uint8Array) return new Uint8Array(out).slice().buffer;
  throw new Error("Unexpected XLSX.write output");
}

describe("runPipelineStages", () => {
  const minimal: Workbook = {
    sheets: [
      {
        name: "S",
        cells: { A1: { address: "A1", type: "string", value: "hi" } },
      },
    ],
  };

  it("succeeds for a round-trippable workbook", () => {
    const r = runPipelineStages(minimal);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.dsl).toContain("XLSXDSL1 v1");
    expect(r.verification.ok).toBe(true);
    expect(r.tokenReport.encodeError).toBeNull();
  });

  it("returns decode failure for invalid DSL when overridden", () => {
    const r = runPipelineStages(minimal, { dsl: "not valid dsl" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    if (r.stage !== "decode") {
      throw new Error(`expected decode stage, got ${r.stage}`);
    }
    expect(r.decodeErrors.length).toBeGreaterThan(0);
    expect(r.workbook).toEqual(minimal);
  });

  it("returns encode failure for invalid AST (e.g. non-finite number)", () => {
    const bad: Workbook = {
      sheets: [
        {
          name: "S",
          cells: { A1: { address: "A1", type: "number", value: Number.NaN } },
        },
      ],
    };
    const r = runPipelineStages(bad);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    if (r.stage !== "encode") {
      throw new Error(`expected encode stage, got ${r.stage}`);
    }
    expect(r.error).toMatch(/validation|finite|AST/i);
    expect(r.tokenReport.encodeError).not.toBeNull();
  });

  it("returns success with verification.ok false when decoded AST mismatches", () => {
    const original: Workbook = {
      sheets: [
        {
          name: "S",
          cells: { A1: { address: "A1", type: "string", value: "x" } },
        },
      ],
    };
    const other: Workbook = {
      sheets: [
        {
          name: "S",
          cells: { A1: { address: "A1", type: "string", value: "y" } },
        },
      ],
    };
    const enc = encodeWorkbookToDsl(other);
    expect(enc.ok).toBe(true);
    if (!enc.ok) return;
    const r = runPipelineStages(original, { dsl: enc.dsl });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.verification.ok).toBe(false);
    expect(r.verification.diffs.length).toBeGreaterThan(0);
  });
});

describe("runPipeline", () => {
  it("fails on truncated xlsx at parse stage", async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[1]]), "S");
    const full = writeWorkbook(wb);
    const truncated = full.slice(0, 20);
    const file = new File([truncated], "bad.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const r = await runPipeline(file);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.stage).toBe("parse");
    expect(r.error.length).toBeGreaterThan(0);
  });

  it("succeeds for a valid xlsx file", async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["a", 1]]), "Sheet1");
    const buf = writeWorkbook(wb);
    const file = new File([buf], "t.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const r = await runPipeline(file);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const p = parseXlsxBuffer(buf);
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(r.workbook.sheets[0].name).toBe(p.workbook.sheets[0].name);
    expect(r.verification.ok).toBe(true);
  });
});
