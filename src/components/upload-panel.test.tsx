import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UploadPanel } from "./upload-panel";

describe("UploadPanel", () => {
  it("shows file name while pipeline is busy", () => {
    render(
      <UploadPanel
        isPipelineBusy
        pipelineBusyFileName="demo.xlsx"
        pipelineSummary={{ status: "loading" }}
      />,
    );
    expect(screen.getByTestId("upload-pipeline-status")).toHaveTextContent(
      /Running pipeline… \(demo\.xlsx\)/,
    );
  });
});
