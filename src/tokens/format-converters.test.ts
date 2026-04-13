import { describe, expect, it } from "vitest";

import type { Workbook } from "@/types";

import {
  astToApproxXmlText,
  astToCanonicalJson,
  astToCsvText,
} from "./format-converters";

const sample: Workbook = {
  sheets: [
    {
      name: "S1",
      cells: {
        B2: { address: "B2", type: "number", value: 3.5 },
        A1: { address: "A1", type: "string", value: 'a,b\nx<y' },
      },
    },
    {
      name: "Empty",
      cells: {},
    },
  ],
};

describe("astToCanonicalJson", () => {
  it("is stable across runs (sorted cell keys)", () => {
    const a = astToCanonicalJson(sample);
    const b = astToCanonicalJson(sample);
    expect(a).toBe(b);
    expect(a).toContain('"A1"');
    expect(a).toContain('"B2"');
    const parsed = JSON.parse(a) as { sheets: { name: string }[] };
    expect(parsed.sheets[0].name).toBe("S1");
    expect(parsed.sheets[1].name).toBe("Empty");
  });
});

describe("astToCsvText", () => {
  it("includes sheet markers and escapes fields", () => {
    const csv = astToCsvText(sample);
    expect(csv).toContain("=== S1 ===");
    expect(csv).toContain("=== Empty ===");
    expect(csv).toContain('"a,b\nx<y"');
  });
});

describe("astToApproxXmlText", () => {
  it("emits simplified workbook XML in row-major order", () => {
    const xml = astToApproxXmlText(sample);
    expect(xml).toMatch(/^<workbook>/);
    expect(xml).toContain('<sheet name="S1">');
    expect(xml.indexOf('r="A1"')).toBeLessThan(xml.indexOf('r="B2"'));
    expect(xml).toContain("&lt;");
    expect(xml.endsWith("</workbook>")).toBe(true);
  });
});
