"use client";

import { decodeDslToWorkbook, type DecoderError } from "@/dsl";
import {
  countVerificationDiffsByKind,
  type PipelineResult,
  verifyWorkbooks,
} from "@/pipeline";
import type { Workbook } from "@/types";
import type { VerificationDiff, VerificationResult } from "@/types/pipeline";

const SHEET_LEVEL: ReadonlySet<VerificationDiff["kind"]> = new Set([
  "sheet_count_mismatch",
  "sheet_name_mismatch",
  "missing_sheet_in_reconstructed",
  "extra_sheet_in_reconstructed",
]);

const KIND_LABELS: Record<VerificationDiff["kind"], string> = {
  sheet_count_mismatch: "Sheet count",
  sheet_name_mismatch: "Sheet name",
  missing_sheet_in_reconstructed: "Missing sheet",
  extra_sheet_in_reconstructed: "Extra sheet",
  cell_type_mismatch: "Cell type",
  formula_mismatch: "Formula",
  value_mismatch: "Cell value",
  missing_in_reconstructed: "Missing cell",
  missing_in_original: "Extra cell",
};

const KIND_DISPLAY_ORDER: VerificationDiff["kind"][] = [
  "sheet_count_mismatch",
  "sheet_name_mismatch",
  "missing_sheet_in_reconstructed",
  "extra_sheet_in_reconstructed",
  "cell_type_mismatch",
  "formula_mismatch",
  "value_mismatch",
  "missing_in_reconstructed",
  "missing_in_original",
];

export type VerificationPanelState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "encode_error"; message: string }
  | { status: "no_dsl"; message: string }
  | { status: "decode_error"; errors: readonly DecoderError[] }
  | { status: "result"; result: VerificationResult };

export function deriveVerificationPanelState(
  workbook: Workbook | null,
  isParsing: boolean,
  encodeError: string | null,
  dslText: string | null,
): VerificationPanelState {
  if (!workbook) return { status: "idle" };
  if (isParsing) return { status: "loading" };
  if (encodeError) return { status: "encode_error", message: encodeError };
  if (dslText == null) return { status: "no_dsl", message: "DSL not generated." };
  const dec = decodeDslToWorkbook(dslText);
  if (!dec.ok) return { status: "decode_error", errors: dec.errors };
  return { status: "result", result: verifyWorkbooks(workbook, dec.workbook) };
}

/** Derives panel state from a full {@link runPipeline} result (no re-encode/decode in the UI). */
export function verificationPanelStateFromPipeline(
  isPipelineRunning: boolean,
  result: PipelineResult | null,
): VerificationPanelState {
  if (isPipelineRunning) return { status: "loading" };
  if (!result) return { status: "idle" };
  if (!result.ok) {
    if (result.stage === "parse") return { status: "idle" };
    if (result.stage === "encode") {
      return { status: "encode_error", message: result.error };
    }
    return { status: "decode_error", errors: result.decodeErrors };
  }
  return { status: "result", result: result.verification };
}

function formatCellValue(v: unknown): string {
  return JSON.stringify(v);
}

function formatVerificationDiff(d: VerificationDiff): string {
  switch (d.kind) {
    case "sheet_count_mismatch":
      return `Expected ${d.expected} sheet(s); reconstructed has ${d.actual}.`;
    case "sheet_name_mismatch":
      return `Sheet position ${d.index + 1}: expected name ${JSON.stringify(d.expected)}, got ${JSON.stringify(d.actual)}.`;
    case "missing_sheet_in_reconstructed":
      return `Sheet position ${d.index + 1} (${JSON.stringify(d.sheetName)}) exists in the original but not in the reconstructed workbook.`;
    case "extra_sheet_in_reconstructed":
      return `Sheet position ${d.index + 1} (${JSON.stringify(d.sheetName)}) is extra in the reconstructed workbook.`;
    case "cell_type_mismatch":
      return `${d.sheetName}!${d.address}: type ${d.expectedType} vs ${d.actualType}.`;
    case "formula_mismatch":
      return `${d.sheetName}!${d.address}: formula ${JSON.stringify(d.expectedFormula)} vs ${JSON.stringify(d.actualFormula)}.`;
    case "value_mismatch":
      return `${d.sheetName}!${d.address}: value ${formatCellValue(d.expected)} vs ${formatCellValue(d.actual)}.`;
    case "missing_in_reconstructed":
      return `${d.sheetName}!${d.address}: missing in reconstructed (expected ${formatCellValue(d.expected)}${d.expectedFormula != null ? `, formula ${JSON.stringify(d.expectedFormula)}` : ""}).`;
    case "missing_in_original":
      return `${d.sheetName}!${d.address}: extra in reconstructed (${formatCellValue(d.actual)}${d.actualFormula != null ? `, formula ${JSON.stringify(d.actualFormula)}` : ""}).`;
    default: {
      const _x: never = d;
      return _x;
    }
  }
}

function VerificationResultView({ result }: { result: VerificationResult }) {
  const counts = countVerificationDiffsByKind(result.diffs);
  const sheetDiffs = result.diffs.filter((d) => SHEET_LEVEL.has(d.kind));
  const cellDiffs = result.diffs.filter((d) => !SHEET_LEVEL.has(d.kind));

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span
          data-testid="verification-badge"
          className={
            result.ok
              ? "inline-flex items-center rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-300"
              : "inline-flex items-center rounded-md border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
          }
        >
          {result.ok ? "Pass" : "Fail"}
        </span>
        <span className="text-sm text-muted-foreground" data-testid="verification-mismatch-total">
          {result.diffs.length === 0
            ? "No mismatches"
            : `${result.diffs.length} mismatch${result.diffs.length === 1 ? "" : "es"}`}
        </span>
      </div>

      <p
        className="mt-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground"
        data-testid="verification-summary"
      >
        {result.summary}
      </p>

      {result.diffs.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2" data-testid="verification-counts">
          {KIND_DISPLAY_ORDER.map((kind) => {
            const n = counts[kind];
            if (!n) return null;
            return (
              <span
                key={kind}
                className="rounded-md border border-border bg-background px-2 py-0.5 text-xs tabular-nums text-foreground"
              >
                {KIND_LABELS[kind]} ×{n}
              </span>
            );
          })}
        </div>
      ) : null}

      {result.diffs.length > 0 ? (
        <div className="mt-4 max-h-64 space-y-3 overflow-y-auto rounded-md border border-border bg-muted/20 p-3 text-sm">
          {sheetDiffs.length > 0 ? (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Sheet-level
              </h3>
              <ul className="list-inside list-disc space-y-1 text-foreground">
                {sheetDiffs.map((d, i) => (
                  <li key={`s-${i}`} className="break-words">
                    {formatVerificationDiff(d)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {cellDiffs.length > 0 ? (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cell-level
              </h3>
              <ul className="list-inside list-disc space-y-1 text-foreground">
                {cellDiffs.map((d, i) => (
                  <li key={`c-${i}`} className="break-words">
                    {formatVerificationDiff(d)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

export type VerificationPanelProps = {
  state: VerificationPanelState;
};

export function VerificationPanel({ state }: VerificationPanelProps) {
  return (
    <section className="flex flex-col rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-medium">Verification</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Decode the generated DSL and compare to the parsed workbook (round-trip check).
      </p>

      <div className="mt-4 flex min-h-[5rem] flex-1 flex-col gap-3">
        {state.status === "idle" ? (
          <p className="text-sm text-muted-foreground">
            Upload a valid .xlsx to run verification here.
          </p>
        ) : null}

        {state.status === "loading" ? (
          <div className="flex flex-col gap-2" aria-hidden data-testid="verification-skeleton">
            <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
            <div className="h-16 w-full animate-pulse rounded-md bg-muted/80" />
          </div>
        ) : null}

        {state.status === "encode_error" ? (
          <p
            className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-200"
            role="status"
            data-testid="verification-encode-blocked"
          >
            Fix DSL encoding first, then verification can run: {state.message}
          </p>
        ) : null}

        {state.status === "no_dsl" ? (
          <p className="text-sm text-muted-foreground" role="status">
            {state.message}
          </p>
        ) : null}

        {state.status === "decode_error" ? (
          <div
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
            data-testid="verification-decode-error"
          >
            <p className="font-medium">DSL decode failed</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {state.errors.map((e, i) => (
                <li key={i}>
                  {e.line != null ? `Line ${e.line}: ` : ""}
                  {e.sheet != null ? `Sheet “${e.sheet}”: ` : ""}
                  {e.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {state.status === "result" ? <VerificationResultView result={state.result} /> : null}
      </div>
    </section>
  );
}
