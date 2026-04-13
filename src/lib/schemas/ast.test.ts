import { describe, expect, it } from "vitest";

import {
  cellAddressSchema,
  sheetSchema,
  verificationResultSchema,
  workbookSchema,
} from "./index";

describe("cellAddressSchema", () => {
  it("accepts valid A1 addresses", () => {
    expect(cellAddressSchema.parse("A1")).toBe("A1");
    expect(cellAddressSchema.parse("AA10")).toBe("AA10");
  });

  it("rejects invalid addresses", () => {
    expect(() => cellAddressSchema.parse("a1")).toThrow();
    expect(() => cellAddressSchema.parse("A0")).toThrow();
    expect(() => cellAddressSchema.parse("1A")).toThrow();
  });
});

describe("workbookSchema", () => {
  const minimalValid = {
    sheets: [
      {
        name: "Sheet1",
        cells: {
          A1: { address: "A1", type: "string" as const, value: "hi" },
        },
      },
    ],
  };

  it("parses a minimal valid workbook", () => {
    const w = workbookSchema.parse(minimalValid);
    expect(w.sheets).toHaveLength(1);
    expect(w.sheets[0].cells.A1.value).toBe("hi");
  });

  it("rejects when cell key does not match address", () => {
    expect(() =>
      workbookSchema.parse({
        sheets: [
          {
            name: "S",
            cells: {
              A1: { address: "B1", type: "string" as const, value: "x" },
            },
          },
        ],
      })
    ).toThrow();
  });

  it("rejects empty workbook", () => {
    expect(() => workbookSchema.parse({ sheets: [] })).toThrow();
  });
});

describe("sheetSchema", () => {
  it("rejects mismatched key and address", () => {
    const r = sheetSchema.safeParse({
      name: "S",
      cells: { A1: { address: "B1", type: "string", value: "x" } },
    });
    expect(r.success).toBe(false);
  });
});

describe("verificationResultSchema", () => {
  it("accepts ok with no diffs", () => {
    const v = verificationResultSchema.parse({ ok: true, diffs: [] });
    expect(v.ok).toBe(true);
  });

  it("accepts a value_mismatch diff", () => {
    const v = verificationResultSchema.parse({
      ok: false,
      diffs: [
        {
          kind: "value_mismatch",
          sheetName: "S1",
          address: "A1",
          expected: 1,
          actual: 2,
        },
      ],
    });
    expect(v.diffs).toHaveLength(1);
  });
});
