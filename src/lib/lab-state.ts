import { countWorkbookCells } from "@/pipeline";
import type { PipelineResult, PipelineTokenReport } from "@/pipeline";
import type { Workbook } from "@/types";

/**
 * Single source of truth for the lab after {@link runPipeline} (or idle / in-flight).
 */
export type LabPipelineUiState =
  | { readonly kind: "idle" }
  | { readonly kind: "running"; readonly fileName: string }
  | { readonly kind: "complete"; readonly result: PipelineResult };

/** Parsed workbook when available (parse succeeded; includes encode/decode failure paths). */
export function workbookFromPipelineResult(
  result: PipelineResult | null,
): Workbook | null {
  if (!result) return null;
  if (!result.ok) {
    if (result.stage === "parse") return null;
    return result.workbook;
  }
  return result.workbook;
}

/** DSL text when encode succeeded, or when decode failed after a successful encode. */
export function dslFromPipelineResult(result: PipelineResult | null): string | null {
  if (!result) return null;
  if (!result.ok) {
    if (result.stage === "decode") return result.dsl;
    return null;
  }
  return result.dsl;
}

export function encodeErrorFromPipelineResult(
  result: PipelineResult | null,
): string | null {
  if (result && !result.ok && result.stage === "encode") return result.error;
  return null;
}

/** Token report whenever parse produced a workbook (encode may have failed). */
export function tokenReportFromPipelineResult(
  result: PipelineResult | null,
): PipelineTokenReport | null {
  if (!result) return null;
  if (!result.ok) {
    if (result.stage === "parse") return null;
    return result.tokenReport;
  }
  return result.tokenReport;
}

export type UploadPipelineSummary =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "ok"; readonly sheets: number; readonly cells: number }
  | { readonly status: "error"; readonly message: string };

export function uploadSummaryFromLabState(state: LabPipelineUiState): UploadPipelineSummary {
  if (state.kind === "idle") return { status: "idle" };
  if (state.kind === "running") return { status: "loading" };
  const r = state.result;
  if (!r.ok && r.stage === "parse") {
    return { status: "error", message: r.error };
  }
  const wb = r.workbook;
  return {
    status: "ok",
    sheets: wb.sheets.length,
    cells: countWorkbookCells(wb),
  };
}
