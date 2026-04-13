import { describe, expect, it } from "vitest";

import type { Workbook } from "@/types";

import {
  FORMAT_LABELS,
  buildAnalyticsSummarySentence,
  pickBestFormatId,
} from "./analytics-summary";
import { buildTokenReport } from "./token-report";

const wb: Workbook = {
  sheets: [
    {
      name: "S",
      cells: {
        A1: { address: "A1", type: "string", value: "x" },
      },
    },
  ],
};

describe("pickBestFormatId", () => {
  it("prefers the smallest token count", () => {
    const r = buildTokenReport(wb);
    const best = pickBestFormatId(r);
    expect(FORMAT_LABELS[best]).toBeTruthy();
    for (const id of ["json", "csv", "approxXml", "dsl"] as const) {
      expect(r.tokenCounts[best]).toBeLessThanOrEqual(r.tokenCounts[id]);
    }
  });
});

describe("buildAnalyticsSummarySentence", () => {
  it("mentions baseline and formats", () => {
    const r = buildTokenReport(wb);
    const s = buildAnalyticsSummarySentence(r);
    expect(s.length).toBeGreaterThan(20);
    expect(s).toMatch(/baseline/i);
  });
});
