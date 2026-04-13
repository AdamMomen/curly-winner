"use client";

import { useRef, useState } from "react";

import { DslPanel } from "@/components/dsl-panel";
import { ParsedSpreadsheetPanel } from "@/components/parsed-spreadsheet-panel";
import { TokenAnalyticsPanel } from "@/components/token-analytics-panel";
import { UploadPanel } from "@/components/upload-panel";
import { ReconstructionPanel } from "@/components/reconstruction-panel";
import {
  VerificationPanel,
  verificationPanelStateFromPipeline,
} from "@/components/verification-panel";
import {
  dslFromPipelineResult,
  encodeErrorFromPipelineResult,
  reconstructionWorkbookFromPipelineResult,
  tokenReportFromPipelineResult,
  uploadSummaryFromLabState,
  workbookFromPipelineResult,
  type LabPipelineUiState,
} from "@/lib/lab-state";
import { cn } from "@/lib/utils";
import { runPipeline } from "@/pipeline";

export function LabWorkspace() {
  const [labState, setLabState] = useState<LabPipelineUiState>({ kind: "idle" });
  const [parsedPanelKey, setParsedPanelKey] = useState(0);
  const pipelineGen = useRef(0);

  const pipelineResult = labState.kind === "complete" ? labState.result : null;
  const workbook = workbookFromPipelineResult(pipelineResult);
  const reconstructionWorkbook =
    reconstructionWorkbookFromPipelineResult(pipelineResult);
  const dslText = dslFromPipelineResult(pipelineResult);
  const encodeError = encodeErrorFromPipelineResult(pipelineResult);
  const tokenReport = tokenReportFromPipelineResult(pipelineResult);
  const isPipelineBusy = labState.kind === "running";
  const uploadSummary = uploadSummaryFromLabState(labState);
  const verificationState = verificationPanelStateFromPipeline(
    isPipelineBusy,
    pipelineResult,
  );

  function handleFileAccepted(file: File) {
    const gen = ++pipelineGen.current;
    setLabState({ kind: "running", fileName: file.name });
    void runPipeline(file).then((result) => {
      if (pipelineGen.current !== gen) return;
      setLabState({ kind: "complete", result });
      const wb = workbookFromPipelineResult(result);
      if (wb) setParsedPanelKey((k) => k + 1);
      else setParsedPanelKey(0);
    });
  }

  function handleLabClear() {
    pipelineGen.current += 1;
    setLabState({ kind: "idle" });
    setParsedPanelKey(0);
  }

  const showPipeline = labState.kind !== "idle";

  return (
    <div
      className={cn(
        "flex w-full flex-1 flex-col",
        !showPipeline && "min-h-0 justify-center",
      )}
    >
      {!showPipeline ? (
        <div className="mx-auto w-full max-w-lg">
          <header className="mb-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Upload a workbook
            </h2>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
              Drop an .xlsx here or choose a file. Preview, encoding, analytics,
              and verification appear below after the pipeline finishes.
            </p>
          </header>
          <UploadPanel
            onFileAccepted={handleFileAccepted}
            onLabClear={handleLabClear}
            isPipelineBusy={isPipelineBusy}
            pipelineSummary={uploadSummary}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold tracking-tight">
              Workbook
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Replace the file anytime; the pipeline runs again and updates every
              section.
            </p>
            <div className="mt-4">
              <UploadPanel
                onFileAccepted={handleFileAccepted}
                onLabClear={handleLabClear}
                isPipelineBusy={isPipelineBusy}
                pipelineSummary={uploadSummary}
              />
            </div>
          </div>

          <div>
            <header className="mb-4 border-b border-border pb-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Pipeline
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">
                Results
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Each block builds on the last—scroll through preview, DSL, tokens,
                verification (round-trip diff, including formulas), then reconstruction
                (export only).
              </p>
            </header>

            <div className="flex flex-col gap-10">
              <div id="lab-parsed" className="scroll-mt-28">
                <ParsedSpreadsheetPanel
                  key={parsedPanelKey}
                  workbook={workbook}
                  isParsing={isPipelineBusy}
                />
              </div>
              <div id="lab-dsl" className="scroll-mt-28">
                <DslPanel
                  key={parsedPanelKey}
                  dsl={dslText}
                  encodeError={encodeError}
                  isLoading={isPipelineBusy}
                />
              </div>
              <div id="lab-tokens" className="scroll-mt-28">
                <TokenAnalyticsPanel
                  report={tokenReport}
                  isLoading={isPipelineBusy}
                />
              </div>
              <div id="lab-verify" className="scroll-mt-28">
                <VerificationPanel state={verificationState} />
              </div>
              <div id="lab-reconstruct" className="scroll-mt-28">
                <ReconstructionPanel
                  workbook={reconstructionWorkbook}
                  isLoading={isPipelineBusy}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
