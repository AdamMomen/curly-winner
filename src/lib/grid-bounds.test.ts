import { describe, expect, it } from "vitest";

import { getSheetBounds } from "./grid-bounds";

describe("getSheetBounds", () => {
  it("returns null for empty sheet", () => {
    expect(getSheetBounds({ name: "S", cells: {} })).toBeNull();
  });

  it("bounds a few cells", () => {
    const b = getSheetBounds({
      name: "S",
      cells: {
        A1: { address: "A1", type: "number", value: 1 },
        C3: { address: "C3", type: "string", value: "x" },
      },
    });
    expect(b).toEqual({ minRow: 0, maxRow: 2, minCol: 0, maxCol: 2 });
  });
});
