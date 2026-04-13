import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { runPipeline, runPipelineStages } from "@/pipeline";
import type { Workbook } from "@/types";

import { LabWorkspace } from "./lab-workspace";

vi.mock("@/pipeline", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/pipeline")>();
  return {
    ...actual,
    runPipeline: vi.fn(),
  };
});

const minimal: Workbook = {
  sheets: [
    {
      name: "S",
      cells: { A1: { address: "A1", type: "string", value: "hi" } },
    },
  ],
};

function pickXlsxFile(): void {
  const input = document.querySelector("input[type=file]");
  expect(input).toBeInstanceOf(HTMLInputElement);
  if (!(input instanceof HTMLInputElement)) return;
  const file = new File(["x"], "sample.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  fireEvent.change(input, { target: { files: [file] } });
}

describe("LabWorkspace", () => {
  beforeEach(() => {
    vi.mocked(runPipeline).mockReset();
  });

  it("runs the pipeline after a valid file is chosen and shows results", async () => {
    const success = runPipelineStages(minimal);
    expect(success.ok).toBe(true);
    if (!success.ok) return;
    vi.mocked(runPipeline).mockResolvedValue(success);

    render(<LabWorkspace />);
    pickXlsxFile();

    await waitFor(() => expect(vi.mocked(runPipeline)).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Results" })).toBeInTheDocument(),
    );
    expect(screen.getByRole("tab", { name: "S" })).toBeInTheDocument();
    expect(screen.getByTestId("dsl-panel-pre")).toHaveTextContent(/A1 s:"hi"/);
  });

  it("shows parse failure from the pipeline in the upload panel", async () => {
    vi.mocked(runPipeline).mockResolvedValue({
      ok: false,
      stage: "parse",
      error: "truncated workbook",
    });

    render(<LabWorkspace />);
    pickXlsxFile();

    await waitFor(() => expect(vi.mocked(runPipeline)).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByText(/Parse failed/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/truncated workbook/i)).toBeInTheDocument();
  });

  it("surfaces encode failure in the DSL panel while keeping the parsed grid", async () => {
    const bad: Workbook = {
      sheets: [
        {
          name: "S",
          cells: { A1: { address: "A1", type: "number", value: Number.NaN } },
        },
      ],
    };
    const encFail = runPipelineStages(bad);
    expect(encFail.ok).toBe(false);
    vi.mocked(runPipeline).mockResolvedValue(encFail);

    render(<LabWorkspace />);
    pickXlsxFile();

    await waitFor(() => expect(vi.mocked(runPipeline)).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Results" })).toBeInTheDocument(),
    );
    expect(screen.getByRole("tab", { name: "S" })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/Encoding failed/i)).toBeInTheDocument(),
    );
  });
});
