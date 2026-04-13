"use client";

import { useMemo, useState } from "react";

import { DslPanel } from "@/components/dsl-panel";
import { ParsedSpreadsheetPanel } from "@/components/parsed-spreadsheet-panel";
import { UploadPanel } from "@/components/upload-panel";
import { encodeWorkbookToDsl } from "@/dsl";
import type { Workbook } from "@/types";

const PLACEHOLDER_SECTIONS = [
  {
    title: "Token analytics",
    description: "Token counts across formats.",
  },
  {
    title: "Reconstruction",
    description: "Decode and export back to XLSX.",
  },
  {
    title: "Verification",
    description: "Round-trip comparison results.",
  },
] as const;

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
        non-empty cells only; encoded XLSXDSL1 appears beside it. Other
        pipeline sections will connect in later phases.
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
        {PLACEHOLDER_SECTIONS.map((section) => (
          <section
            key={section.title}
            className="flex flex-col rounded-lg border border-border bg-card p-5 shadow-sm"
          >
            <h2 className="text-base font-medium">{section.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {section.description}
            </p>
            <div
              className="mt-4 min-h-[5rem] flex-1 rounded-md border border-dashed border-muted-foreground/25 bg-muted/30"
              aria-hidden
            />
          </section>
        ))}
      </div>
    </>
  );
}
