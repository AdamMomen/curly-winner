import { describe, expect, it } from "vitest";

import { encodeWorkbookToDsl } from "@/dsl";
import type { Workbook } from "@/types";

import { buildTokenReport } from "./token-report";

const minimal: Workbook = {
  sheets: [
    {
      name: "S",
      cells: {
        A1: { address: "A1", type: "string", value: "hi" },
      },
    },
  ],
};

describe("buildTokenReport", () => {
  it("returns all format strings and counts", () => {
    const r = buildTokenReport(minimal);
    expect(r.encodeError).toBeNull();
    expect(r.strings.json.length).toBeGreaterThan(0);
    expect(r.strings.csv).toContain("=== S ===");
    expect(r.strings.approxXml).toContain("<workbook>");
    expect(r.strings.dsl).toContain("XLSXDSL1 v1");
    expect(r.tokenCounts.json).toBeGreaterThan(0);
    expect(r.referenceTokens).toBe(
      Math.max(r.tokenCounts.json, r.tokenCounts.csv, r.tokenCounts.approxXml),
    );
  });

  it("matches encoder output when dsl override is omitted", () => {
    const enc = encodeWorkbookToDsl(minimal);
    expect(enc.ok).toBe(true);
    if (!enc.ok) return;
    const r = buildTokenReport(minimal);
    expect(r.strings.dsl).toBe(enc.dsl);
  });

  it("uses dsl override when provided", () => {
    const r = buildTokenReport(minimal, "CUSTOM\n");
    expect(r.strings.dsl).toBe("CUSTOM\n");
    expect(r.tokenCounts.dsl).toBeGreaterThan(0);
  });

  it("is deterministic for the same workbook", () => {
    const a = buildTokenReport(minimal);
    const b = buildTokenReport(minimal);
    expect(a.strings).toEqual(b.strings);
    expect(a.tokenCounts).toEqual(b.tokenCounts);
  });

  it("computes reduction vs reference for dsl", () => {
    const r = buildTokenReport(minimal);
    expect(r.reductionVsReferencePct.dsl).toBeGreaterThanOrEqual(0);
    expect(r.pctOfReference.json).toBe(100);
  });
});
