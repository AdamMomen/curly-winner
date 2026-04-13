import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  DSL_PANEL_COLLAPSE_MAX_LINES,
  DslPanel,
} from "@/components/dsl-panel";

describe("DslPanel", () => {
  it("shows skeleton while loading", () => {
    render(<DslPanel dsl={null} encodeError={null} isLoading />);
    expect(screen.getByTestId("dsl-panel-skeleton")).toBeInTheDocument();
  });

  it("shows empty state when idle", () => {
    render(<DslPanel dsl={null} encodeError={null} isLoading={false} />);
    expect(
      screen.getByText(/Upload a valid .xlsx to generate DSL here./),
    ).toBeInTheDocument();
  });

  it("renders DSL with preserved newlines and character count", () => {
    const dsl = "XLSXDSL1 v1\n\nsheet S\nA1 s:\"hi\"\n";
    render(<DslPanel dsl={dsl} encodeError={null} isLoading={false} />);
    const pre = screen.getByTestId("dsl-panel-pre");
    expect(pre.textContent).toBe(dsl);
    expect(screen.getByText(`${dsl.length} characters`)).toBeInTheDocument();
  });

  it("shows encoding error", () => {
    render(
      <DslPanel
        dsl={null}
        encodeError="AST validation failed: …"
        isLoading={false}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/Encoding failed/);
  });

  it("copies full DSL via clipboard API", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText },
    });

    const dsl = "XLSXDSL1 v1\n";
    render(<DslPanel dsl={dsl} encodeError={null} isLoading={false} />);
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(dsl);
    });

    vi.unstubAllGlobals();
  });

  it("truncates long DSL until expanded", () => {
    const lines = Array.from(
      { length: DSL_PANEL_COLLAPSE_MAX_LINES + 5 },
      (_, i) => `line ${i + 1}`,
    );
    const dsl = `${lines.join("\n")}\n`;
    render(<DslPanel dsl={dsl} encodeError={null} isLoading={false} />);

    const pre = screen.getByTestId("dsl-panel-pre");
    expect(pre.textContent).toContain("…");
    expect(pre.textContent).not.toContain("line 25");

    fireEvent.click(screen.getByRole("button", { name: /show all/i }));
    expect(pre.textContent).toContain("line 25");
    expect(pre.textContent).not.toContain("…");

    fireEvent.click(screen.getByRole("button", { name: /show less/i }));
    expect(pre.textContent).toContain("…");
  });
});
