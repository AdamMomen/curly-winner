import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Workbook } from "@/types";

import { ReconstructionPanel } from "./reconstruction-panel";

const minimal: Workbook = {
  sheets: [
    {
      name: "S",
      cells: { A1: { address: "A1", type: "string", value: "x" } },
    },
  ],
};

const mismatchedKey: Workbook = {
  sheets: [
    {
      name: "S",
      cells: { A1: { address: "B1", type: "string", value: "x" } },
    },
  ],
};

describe("ReconstructionPanel", () => {
  it("shows skeleton while loading", () => {
    render(<ReconstructionPanel workbook={minimal} isLoading />);
    expect(screen.getByTestId("reconstruction-skeleton")).toBeInTheDocument();
  });

  it("shows idle copy without workbook", () => {
    render(<ReconstructionPanel workbook={null} isLoading={false} />);
    expect(screen.getByTestId("reconstruction-empty")).toHaveTextContent(/No export yet/);
  });

  it("shows download when workbook is present", () => {
    render(<ReconstructionPanel workbook={minimal} isLoading={false} />);
    expect(screen.getByTestId("reconstruction-download")).toBeInTheDocument();
  });

  it("shows export error when AST fails validation", () => {
    render(<ReconstructionPanel workbook={mismatchedKey} isLoading={false} />);
    fireEvent.click(screen.getByTestId("reconstruction-download"));
    expect(screen.getByTestId("reconstruction-export-error")).toHaveTextContent(
      /AST validation failed/,
    );
  });
});
