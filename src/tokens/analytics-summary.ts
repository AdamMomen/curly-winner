import { TOKEN_FORMAT_IDS, type TokenFormatId, type TokenReport } from "./token-report";

export const FORMAT_LABELS: Record<TokenFormatId, string> = {
  json: "JSON",
  csv: "CSV",
  approxXml: "Approx. XML",
  dsl: "XLSXDSL1",
};

/** Format with the lowest estimated token count (stable tie-break: order in TOKEN_FORMAT_IDS). */
export function pickBestFormatId(report: TokenReport): TokenFormatId {
  let best: TokenFormatId = TOKEN_FORMAT_IDS[0]!;
  let min = report.tokenCounts[best];
  for (const id of TOKEN_FORMAT_IDS) {
    const n = report.tokenCounts[id];
    if (n < min) {
      min = n;
      best = id;
    }
  }
  return best;
}

/** Short paragraph for the analytics card. */
export function buildAnalyticsSummarySentence(report: TokenReport): string {
  const bestId = pickBestFormatId(report);
  const bestLabel = FORMAT_LABELS[bestId];
  const bestN = report.tokenCounts[bestId];
  const dslN = report.tokenCounts.dsl;
  const dslSaved = report.reductionVsReferencePct.dsl;

  if (report.referenceTokens === 0) {
    return "The JSON/CSV/XML reference is empty for this workbook; token comparison is trivial.";
  }

  if (bestId === "dsl") {
    return `${FORMAT_LABELS.dsl} has the lowest estimate (${dslN.toLocaleString()} tokens), about ${Math.round(dslSaved)}% below the JSON/CSV/XML baseline (${report.referenceTokens.toLocaleString()} tokens).`;
  }

  return `${bestLabel} has the lowest estimate (${bestN.toLocaleString()} tokens). ${FORMAT_LABELS.dsl} uses ${dslN.toLocaleString()} tokens, about ${Math.round(dslSaved)}% below the same baseline (${report.referenceTokens.toLocaleString()} tokens).`;
}
