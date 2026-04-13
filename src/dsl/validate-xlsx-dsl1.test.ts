import { describe, expect, it } from "vitest";
import {
  CANONICAL_XLSXDSL1_FIXTURES,
  validateXlsxDsl1,
} from "./validate-xlsx-dsl1";

describe("validateXlsxDsl1", () => {
  it("accepts all canonical fixtures", () => {
    for (const [label, doc] of CANONICAL_XLSXDSL1_FIXTURES) {
      const r = validateXlsxDsl1(doc);
      expect(r, label).toEqual({ ok: true });
    }
  });

  it("rejects wrong header", () => {
    const r = validateXlsxDsl1("XLSXDSL1 v2\n\nsheet A\nA1 s:\"x\"\n");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toContain("line 1");
  });

  it("rejects separator before first sheet", () => {
    const r = validateXlsxDsl1("XLSXDSL1 v1\n\n---\n\nsheet A\nA1 s:\"x\"\n");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.includes("separator"))).toBe(true);
  });

  it("rejects duplicate address in a sheet", () => {
    const r = validateXlsxDsl1(
      "XLSXDSL1 v1\n\nsheet S\nA1 s:\"a\"\nA1 s:\"b\"\n",
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.includes("duplicate"))).toBe(true);
  });

  it("rejects invalid boolean payload", () => {
    const r = validateXlsxDsl1(
      "XLSXDSL1 v1\n\nsheet S\nA1 b:TRUE\n",
    );
    expect(r.ok).toBe(false);
  });

  it("rejects non-finite number", () => {
    const r = validateXlsxDsl1(
      "XLSXDSL1 v1\n\nsheet S\nA1 n:NaN\n",
    );
    expect(r.ok).toBe(false);
  });

  it("accepts JSON sheet name", () => {
    const r = validateXlsxDsl1(
      'XLSXDSL1 v1\n\nsheet "Q1 / Rev2"\nA1 s:"ok"\n',
    );
    expect(r).toEqual({ ok: true });
  });

  it("normalizes CRLF", () => {
    const r = validateXlsxDsl1(
      "XLSXDSL1 v1\r\n\r\nsheet S\r\nA1 s:\"x\"\r\n",
    );
    expect(r).toEqual({ ok: true });
  });
});
