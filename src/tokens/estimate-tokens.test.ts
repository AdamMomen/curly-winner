import { describe, expect, it } from "vitest";

import { APPROX_CHARS_PER_TOKEN, estimateTokenCount } from "./estimate-tokens";

describe("estimateTokenCount", () => {
  it("returns 0 for empty string", () => {
    expect(estimateTokenCount("")).toBe(0);
  });

  it("is deterministic", () => {
    const s = "hello world\n\t";
    expect(estimateTokenCount(s)).toBe(estimateTokenCount(s));
  });

  it("uses ceil(length / charsPerToken)", () => {
    expect(estimateTokenCount("abcd")).toBe(1);
    expect(estimateTokenCount("abcde")).toBe(2);
    expect(estimateTokenCount("a".repeat(APPROX_CHARS_PER_TOKEN))).toBe(1);
    expect(estimateTokenCount("a".repeat(APPROX_CHARS_PER_TOKEN + 1))).toBe(2);
  });
});
