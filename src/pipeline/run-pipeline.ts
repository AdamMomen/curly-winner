import { decodeDslToWorkbook, encodeWorkbookToDsl } from "@/dsl";
import type { DecoderError } from "@/dsl";
import { buildTokenReport } from "@/tokens";
import type { TokenReport } from "@/tokens";
import type { Workbook } from "@/types";
import type { VerificationResult } from "@/types/pipeline";

import { parseXlsxFile } from "./parse-xlsx";
import { verifyWorkbooks } from "./verify-workbooks";

/** Full token analytics row including DSL encode diagnostics. */
export type PipelineTokenReport = TokenReport & { encodeError: string | null };

export type PipelineSuccess = {
  readonly ok: true;
  readonly workbook: Workbook;
  readonly dsl: string;
  readonly tokenReport: PipelineTokenReport;
  readonly decodedWorkbook: Workbook;
  /** Round-trip check; `ok: false` means AST mismatch (pipeline still completed). */
  readonly verification: VerificationResult;
};

export type PipelineFailure =
  | { readonly ok: false; readonly stage: "parse"; readonly error: string }
  | {
      readonly ok: false;
      readonly stage: "encode";
      readonly error: string;
      readonly workbook: Workbook;
      readonly tokenReport: PipelineTokenReport;
    }
  | {
      readonly ok: false;
      readonly stage: "decode";
      readonly error: string;
      readonly decodeErrors: readonly DecoderError[];
      readonly workbook: Workbook;
      readonly dsl: string;
      readonly tokenReport: PipelineTokenReport;
    };

export type PipelineResult = PipelineSuccess | PipelineFailure;

export type RunPipelineStagesOptions = {
  /**
   * When set, skips encode and uses this DSL for decode + verify (e.g. tests).
   * Must still match `workbook` if you expect verification to pass.
   */
  readonly dsl?: string;
};

/**
 * Run encode → token report → decode → verify on an already-parsed workbook.
 * Fails closed on encode or decode errors; verification outcome is always returned on success.
 */
export function runPipelineStages(
  workbook: Workbook,
  opts?: RunPipelineStagesOptions,
): PipelineResult {
  let dsl: string;
  let tokenReport: PipelineTokenReport;

  if (opts?.dsl !== undefined) {
    dsl = opts.dsl;
    tokenReport = buildTokenReport(workbook, dsl);
  } else {
    const enc = encodeWorkbookToDsl(workbook);
    tokenReport = buildTokenReport(workbook, enc.ok ? enc.dsl : undefined);
    if (!enc.ok) {
      return {
        ok: false,
        stage: "encode",
        error: enc.error,
        workbook,
        tokenReport,
      };
    }
    dsl = enc.dsl;
  }

  const dec = decodeDslToWorkbook(dsl);
  if (!dec.ok) {
    const msg =
      dec.errors.map((e) => e.message).join("; ") || "DSL decode failed";
    return {
      ok: false,
      stage: "decode",
      error: msg,
      decodeErrors: dec.errors,
      workbook,
      dsl,
      tokenReport,
    };
  }

  const verification = verifyWorkbooks(workbook, dec.workbook);
  return {
    ok: true,
    workbook,
    dsl,
    tokenReport,
    decodedWorkbook: dec.workbook,
    verification,
  };
}

/**
 * End-to-end lab pipeline: parse XLSX from a {@link File}, then {@link runPipelineStages}.
 */
export async function runPipeline(file: File): Promise<PipelineResult> {
  const parsed = await parseXlsxFile(file);
  if (!parsed.ok) {
    return { ok: false, stage: "parse", error: parsed.error };
  }
  return runPipelineStages(parsed.workbook);
}
