import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { encodeWorkbookToDsl } from "@/dsl";
import type { Workbook } from "@/types";

import {
  VerificationPanel,
  deriveVerificationPanelState,
} from "./verification-panel";

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

describe("deriveVerificationPanelState", () => {
  it("is idle without workbook", () => {
    expect(deriveVerificationPanelState(null, false, null, null)).toEqual({
      status: "idle",
    });
  });

  it("is loading while parsing", () => {
    expect(deriveVerificationPanelState(minimal, true, null, "x")).toEqual({
      status: "loading",
    });
  });

  it("surfaces encode errors before decode", () => {
    expect(
      deriveVerificationPanelState(minimal, false, "AST invalid", null),
    ).toEqual({
      status: "encode_error",
      message: "AST invalid",
    });
  });

  it("returns decode_error for invalid DSL", () => {
    const s = deriveVerificationPanelState(minimal, false, null, "bad");
    expect(s.status).toBe("decode_error");
    if (s.status === "decode_error") {
      expect(s.errors.length).toBeGreaterThan(0);
    }
  });

  it("returns pass when DSL round-trips", () => {
    const enc = encodeWorkbookToDsl(minimal);
    expect(enc.ok).toBe(true);
    if (!enc.ok) return;
    const s = deriveVerificationPanelState(minimal, false, null, enc.dsl);
    expect(s.status).toBe("result");
    if (s.status === "result") {
      expect(s.result.ok).toBe(true);
      expect(s.result.diffs).toHaveLength(0);
    }
  });
});

describe("VerificationPanel", () => {
  it("shows pass badge for successful verification", () => {
    const enc = encodeWorkbookToDsl(minimal);
    expect(enc.ok).toBe(true);
    if (!enc.ok) return;
    const state = deriveVerificationPanelState(minimal, false, null, enc.dsl);
    render(<VerificationPanel state={state} />);
    expect(screen.getByTestId("verification-badge")).toHaveTextContent("Pass");
    expect(screen.getByTestId("verification-summary")).toBeInTheDocument();
    expect(screen.getByTestId("verification-mismatch-total")).toHaveTextContent(
      "No mismatches",
    );
  });

  it("shows fail, counts, and cell diff list", () => {
    const a = minimal;
    const b: Workbook = {
      sheets: [
        {
          name: "S",
          cells: {
            A1: { address: "A1", type: "string", value: "bye" },
          },
        },
      ],
    };
    const enc = encodeWorkbookToDsl(b);
    expect(enc.ok).toBe(true);
    if (!enc.ok) return;
    const state = deriveVerificationPanelState(a, false, null, enc.dsl);
    expect(state.status).toBe("result");
    if (state.status !== "result") return;
    render(<VerificationPanel state={state} />);
    expect(screen.getByTestId("verification-badge")).toHaveTextContent("Fail");
    expect(screen.getByTestId("verification-counts")).toHaveTextContent(
      "Cell value",
    );
    expect(screen.getByText(/Cell-level/i)).toBeInTheDocument();
    expect(screen.getByText(/S!A1/i)).toBeInTheDocument();
  });

  it("shows decode error list", () => {
    render(
      <VerificationPanel
        state={{
          status: "decode_error",
          errors: [{ line: 1, message: "bad header" }],
        }}
      />,
    );
    expect(screen.getByTestId("verification-decode-error")).toHaveTextContent(
      /DSL decode failed/,
    );
    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
  });

  it("shows skeleton while loading", () => {
    render(<VerificationPanel state={{ status: "loading" }} />);
    expect(screen.getByTestId("verification-skeleton")).toBeInTheDocument();
  });
});
