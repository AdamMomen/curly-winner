import { describe, expect, it } from "vitest";

import {
  colIndexToLetters,
  decodeA1,
  encodeA1,
  lettersToColIndex,
} from "./a1";

describe("lettersToColIndex", () => {
  it("maps A and Z", () => {
    expect(lettersToColIndex("A")).toBe(0);
    expect(lettersToColIndex("Z")).toBe(25);
  });

  it("maps AA", () => {
    expect(lettersToColIndex("AA")).toBe(26);
  });
});

describe("decodeA1", () => {
  it("decodes A1 and B2", () => {
    expect(decodeA1("A1")).toEqual({ row: 0, col: 0 });
    expect(decodeA1("B2")).toEqual({ row: 1, col: 1 });
  });

  it("decodes AA10", () => {
    expect(decodeA1("AA10")).toEqual({ row: 9, col: 26 });
  });
});

describe("colIndexToLetters", () => {
  it("round-trips with decode", () => {
    expect(colIndexToLetters(0)).toBe("A");
    expect(colIndexToLetters(25)).toBe("Z");
    expect(colIndexToLetters(26)).toBe("AA");
  });
});

describe("encodeA1", () => {
  it("matches decodeA1", () => {
    expect(encodeA1(0, 0)).toBe("A1");
    expect(encodeA1(9, 26)).toBe("AA10");
    expect(decodeA1(encodeA1(4, 7))).toEqual({ row: 4, col: 7 });
  });
});
