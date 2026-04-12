import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("zod", () => {
  it("parses a simple string schema", () => {
    expect(z.string().parse("ok")).toBe("ok");
  });
});
