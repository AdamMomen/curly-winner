import { encodeWorkbookToDsl } from "@/dsl";
import type { Workbook } from "@/types";

import { estimateTokenCount } from "./estimate-tokens";
import { astToApproxXmlText, astToCanonicalJson, astToCsvText } from "./format-converters";

export const TOKEN_FORMAT_IDS = ["json", "csv", "approxXml", "dsl"] as const;
export type TokenFormatId = (typeof TOKEN_FORMAT_IDS)[number];

export type TokenReport = {
  /** Matches docs/token-counting.md */
  strategy: "approx_utf16_length_div_4";
  charsPerToken: 4;
  strings: Record<TokenFormatId, string>;
  tokenCounts: Record<TokenFormatId, number>;
  /** `max(json, csv, approxXml)` — DSL is compared against verbose encodings. */
  referenceTokens: number;
  /** `count / referenceTokens` as percentage (0–100+); 100 when reference is 0. */
  pctOfReference: Record<TokenFormatId, number>;
  /** `(referenceTokens - count) / referenceTokens * 100`;0 when reference is 0. */
  reductionVsReferencePct: Record<TokenFormatId, number>;
  /**
   * Estimated **semantic loss** vs the canonical AST (0–100): share of occupied cells
   * where the serialized string drops recoverable structure. Today only **CSV** drops
   * formula text (values-only grid); JSON, approximate XML, and XLSXDSL1 keep formulas.
   */
  lossPctByFormat: Record<TokenFormatId, number>;
};

function countOccupiedCells(workbook: Workbook): number {
  return workbook.sheets.reduce((n, sheet) => n + Object.keys(sheet.cells).length, 0);
}

function countFormulaCells(workbook: Workbook): number {
  let n = 0;
  for (const sheet of workbook.sheets) {
    for (const cell of Object.values(sheet.cells)) {
      if (cell.type === "formula") n++;
    }
  }
  return n;
}

/** Per-format semantic loss % (see {@link TokenReport.lossPctByFormat}). */
export function semanticLossPctByFormat(workbook: Workbook): Record<TokenFormatId, number> {
  const total = countOccupiedCells(workbook);
  const formulaCells = countFormulaCells(workbook);
  const csvLoss = total === 0 ? 0 : (formulaCells / total) * 100;
  return {
    json: 0,
    csv: csvLoss,
    approxXml: 0,
    dsl: 0,
  };
}

function buildStrings(workbook: Workbook, dslOverride: string | undefined): {
  strings: Record<TokenFormatId, string>;
  encodeError: string | null;
} {
  const json = astToCanonicalJson(workbook);
  const csv = astToCsvText(workbook);
  const approxXml = astToApproxXmlText(workbook);

  let dsl: string;
  let encodeError: string | null = null;
  if (dslOverride !== undefined) {
    dsl = dslOverride;
  } else {
    const r = encodeWorkbookToDsl(workbook);
    if (r.ok) {
      dsl = r.dsl;
    } else {
      encodeError = r.error;
      dsl = "";
    }
  }

  return {
    strings: { json, csv, approxXml, dsl },
    encodeError,
  };
}

/**
 * Produce strings for all comparison formats and deterministic token estimates.
 * @param dslOverride — When set (e.g. from the UI encoder), must match `encodeWorkbookToDsl(workbook)` for consistency.
 */
export function buildTokenReport(
  workbook: Workbook,
  dslOverride?: string,
): TokenReport & { encodeError: string | null } {
  const lossPctByFormat = semanticLossPctByFormat(workbook);
  const { strings, encodeError } = buildStrings(workbook, dslOverride);
  const tokenCounts = {
    json: estimateTokenCount(strings.json),
    csv: estimateTokenCount(strings.csv),
    approxXml: estimateTokenCount(strings.approxXml),
    dsl: estimateTokenCount(strings.dsl),
  } satisfies Record<TokenFormatId, number>;

  const referenceTokens = Math.max(tokenCounts.json, tokenCounts.csv, tokenCounts.approxXml);

  const pctOfReference = {} as Record<TokenFormatId, number>;
  const reductionVsReferencePct = {} as Record<TokenFormatId, number>;

  for (const id of TOKEN_FORMAT_IDS) {
    if (referenceTokens === 0) {
      pctOfReference[id] = 100;
      reductionVsReferencePct[id] = 0;
    } else {
      const n = tokenCounts[id];
      pctOfReference[id] = (n / referenceTokens) * 100;
      reductionVsReferencePct[id] = ((referenceTokens - n) / referenceTokens) * 100;
    }
  }

  return {
    strategy: "approx_utf16_length_div_4",
    charsPerToken: 4,
    strings,
    tokenCounts,
    referenceTokens,
    pctOfReference,
    reductionVsReferencePct,
    lossPctByFormat,
    encodeError,
  };
}
