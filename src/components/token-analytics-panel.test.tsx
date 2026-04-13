import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Workbook } from "@/types";

import { buildTokenReport } from "@/tokens/token-report";

import { TokenAnalyticsPanel } from "./token-analytics-panel";

const wb: Workbook = {
  sheets: [
    {
      name: "S",
      cells: {
        A1: { address: "A1", type: "string", value: "test" },
      },
    },
  ],
};

describe("TokenAnalyticsPanel", () => {
  it("shows skeleton while loading", () => {
    render(<TokenAnalyticsPanel report={null} isLoading />);
    expect(screen.getByTestId("token-analytics-skeleton")).toBeInTheDocument();
  });

  it("renders table and summary for a report", () => {
    const report = buildTokenReport(wb);
    render(<TokenAnalyticsPanel report={report} isLoading={false} />);
    expect(screen.getByRole("columnheader", { name: /format/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /loss %/i })).toBeInTheDocument();
    expect(screen.getByTestId("token-loss-csv")).toHaveTextContent("0%");
    expect(screen.getByTestId("token-analytics-summary")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /JSON/i })).toBeInTheDocument();
    const dslRow = screen.getByTestId("token-format-row-dsl");
    expect(within(dslRow).getByLabelText(/winner encoding/i)).toBeInTheDocument();
    expect(within(dslRow).getByText("Winner")).toBeInTheDocument();
  });
});
