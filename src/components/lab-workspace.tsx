"use client";

import { useMemo, useState } from "react";

import { DslPanel } from "@/components/dsl-panel";
import { ParsedSpreadsheetPanel } from "@/components/parsed-spreadsheet-panel";
import { TokenAnalyticsPanel } from "@/components/token-analytics-panel";
import { UploadPanel } from "@/components/upload-panel";
import { ReconstructionPanel } from "@/components/reconstruction-panel";
import {
  VerificationPanel,
  deriveVerificationPanelState,
} from "@/components/verification-panel";
import { encodeWorkbookToDsl } from "@/dsl";
import { buildTokenReport } from "@/tokens";
import type { Workbook } from "@/types";

export function LabWorkspace() {
  const [workbook, setWorkbook] = useState<Workbook | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  /** Bumps when a new workbook is parsed so the grid remounts with tab 0. */
  const [parsedPanelKey, setParsedPanelKey] = useState(0);

  const { dslText, encodeError } = useMemo(() => {
    if (!workbook) {
      return { dslText: null as string | null, encodeError: null as string | null };
    }
    const r = encodeWorkbookToDsl(workbook);
    if (r.ok) {
      return { dslText: r.dsl, encodeError: null };
    }
    return { dslText: null, encodeError: r.error };
  }, [workbook]);

  const tokenReport = useMemo(() => {
    if (!workbook) return null;
    return buildTokenReport(workbook, dslText ?? undefined);
  }, [workbook, dslText]);

  const verificationState = useMemo(
    () => deriveVerificationPanelState(workbook, isParsing, encodeError, dslText),
    [workbook, isParsing, encodeError, dslText],
  );

  function handleWorkbookChange(next: Workbook | null) {
    setWorkbook(next);
    if (next) {
      setParsedPanelKey((k) => k + 1);
    } else {
      setParsedPanelKey(0);
    }
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">
        Upload a workbook to parse it into the canonical AST. The grid shows
        non-empty cells only; DSL and token analytics update from the same AST.
        Verification runs automatically when DSL is available.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <UploadPanel
          onWorkbookChange={handleWorkbookChange}
          onParsingChange={setIsParsing}
        />
        <ParsedSpreadsheetPanel
          key={parsedPanelKey}
          workbook={workbook}
          isParsing={isParsing}
        />
        <DslPanel
          key={parsedPanelKey}
          dsl={dslText}
          encodeError={encodeError}
          isLoading={isParsing}
        />
        <TokenAnalyticsPanel report={tokenReport} isLoading={isParsing} />
        <VerificationPanel state={verificationState} />
        <ReconstructionPanel workbook={workbook} isLoading={isParsing} />
      </div>
    </>
  );
}
