import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home page", () => {
  it("explains the lab in plain language", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { name: "XLSX Encoding Lab" }),
    ).toBeInTheDocument();
    const main = screen.getByRole("main");
    expect(main).toHaveTextContent(/This lab turns/);
    expect(main).toHaveTextContent(/XLSXDSL1/);
    expect(main).toHaveTextContent(/token counts/);
    expect(main).toHaveTextContent(/formulas/);
  });
});
