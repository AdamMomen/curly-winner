import type { CellAddress, CellValue, Workbook } from "./ast";

/** External formats used for token comparison (PRD §6.4). */
export type TokenFormat = "xlsx-xml" | "csv" | "json" | "dsl";

/** Per-format estimated token totals. */
export interface TokenReport {
  readonly byFormat: Readonly<Partial<Record<TokenFormat, number>>>;
  /** Format used as baseline for “% reduction” (e.g. CSV). */
  readonly baseline: TokenFormat;
  /** Percent reduction vs baseline for the DSL row (0–100), if computable. */
  readonly dslReductionVsBaselinePct: number | null;
}

/** Single mismatch between original AST and reconstructed AST. */
export type VerificationDiff =
  | {
      readonly kind: "value_mismatch";
      readonly sheetName: string;
      readonly address: CellAddress;
      readonly expected: CellValue;
      readonly actual: CellValue;
    }
  | {
      readonly kind: "missing_in_reconstructed";
      readonly sheetName: string;
      readonly address: CellAddress;
      readonly expected: CellValue;
    }
  | {
      readonly kind: "missing_in_original";
      readonly sheetName: string;
      readonly address: CellAddress;
      readonly actual: CellValue;
    };

/** Result of comparing original workbook AST to reconstructed AST. */
export interface VerificationResult {
  readonly ok: boolean;
  readonly diffs: readonly VerificationDiff[];
}

/** Client pipeline state (minimal v1; extend as features land). */
export interface AppState {
  readonly file: File | null;
  readonly workbook: Workbook | null;
  readonly dsl: string | null;
  readonly tokenReport: TokenReport | null;
  readonly verification: VerificationResult | null;
  readonly error: string | null;
}
