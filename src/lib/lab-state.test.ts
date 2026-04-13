import { describe, expect, it } from "vitest";

import type { PipelineResult } from "@/pipeline";
import { runPipelineStages } from "@/pipeline";
import type { Workbook } from "@/types";

import {
  dslFromPipelineResult,
  encodeErrorFromPipelineResult,
  tokenReportFromPipelineResult,
  uploadSummaryFromLabState,
  workbookFromPipelineResult,
} from "./lab-state";

const minimal: Workbook = {
  sheets: [
    {
      name: "S",
      cells: { A1: { address: "A1", type: "string", value: "hi" } },
    },
  ],
};

describe("workbookFromPipelineResult", () => {
  it("returns null for parse failure or null", () => {
    expect(workbookFromPipelineResult(null)).toBeNull();
    const parseFail: PipelineResult = {
      ok: false,
      stage: "parse",
      error: "bad",
    };
    expect(workbookFromPipelineResult(parseFail)).toBeNull();
  });

  it("returns workbook for pipeline success", () => {
    const r = runPipelineStages(minimal);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(workbookFromPipelineResult(r)).toBe(minimal);
  });

  it("returns workbook for encode failure", () => {
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
    expect(r.stage).toBe("encode");
    expect(workbookFromPipelineResult(r)).toBe(bad);
  });
});

describe("dslFromPipelineResult / encodeErrorFromPipelineResult / tokenReportFromPipelineResult", () => {
  it("returns nulls for null result", () => {
    expect(dslFromPipelineResult(null)).toBeNull();
    expect(encodeErrorFromPipelineResult(null)).toBeNull();
    expect(tokenReportFromPipelineResult(null)).toBeNull();
  });

  it("encode failure: no dsl, encode error set, token report present", () => {
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
    if (r.stage !== "encode") return;
    expect(dslFromPipelineResult(r)).toBeNull();
    expect(encodeErrorFromPipelineResult(r)).toBe(r.error);
    expect(tokenReportFromPipelineResult(r)).toEqual(r.tokenReport);
  });

  it("decode failure: dsl present, token report present", () => {
    const wb = minimal;
    const stages = runPipelineStages(wb);
    expect(stages.ok).toBe(true);
    if (!stages.ok) return;
    const r: PipelineResult = {
      ok: false,
      stage: "decode",
      error: "bad",
      decodeErrors: [{ line: 1, message: "m" }],
      workbook: wb,
      dsl: "XLSXDSL1 v1\n",
      tokenReport: stages.tokenReport,
    };
    expect(dslFromPipelineResult(r)).toBe("XLSXDSL1 v1\n");
    expect(encodeErrorFromPipelineResult(r)).toBeNull();
    expect(tokenReportFromPipelineResult(r)).toEqual(stages.tokenReport);
  });
});

describe("uploadSummaryFromLabState", () => {
  it("maps idle / running / parse error / ok", () => {
    expect(uploadSummaryFromLabState({ kind: "idle" })).toEqual({ status: "idle" });
    expect(uploadSummaryFromLabState({ kind: "running", fileName: "a.xlsx" })).toEqual({
      status: "loading",
    });
    const parseErr: PipelineResult = { ok: false, stage: "parse", error: "truncated" };
    expect(
      uploadSummaryFromLabState({ kind: "complete", result: parseErr }),
    ).toEqual({
      status: "error",
      message: "truncated",
    });
    const ok = runPipelineStages(minimal);
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(uploadSummaryFromLabState({ kind: "complete", result: ok })).toEqual({
      status: "ok",
      sheets: 1,
      cells: 1,
    });
  });
});
