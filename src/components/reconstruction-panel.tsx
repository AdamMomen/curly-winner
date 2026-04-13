"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { RECONSTRUCTED_XLSX_FILENAME, workbookToXlsxBuffer } from "@/pipeline";
import type { Workbook } from "@/types";

export type ReconstructionPanelProps = {
  workbook: Workbook | null;
  isLoading: boolean;
};

function triggerDownload(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ReconstructionPanel({ workbook, isLoading }: ReconstructionPanelProps) {
  const [exportError, setExportError] = useState<string | null>(null);

  function handleDownload() {
    if (!workbook) return;
    setExportError(null);
    const r = workbookToXlsxBuffer(workbook);
    if (!r.ok) {
      setExportError(r.error);
      return;
    }
    try {
      triggerDownload(r.buffer, RECONSTRUCTED_XLSX_FILENAME);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <section className="flex flex-col rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-medium">Reconstruction</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Download-only: builds an .xlsx from the canonical AST (decoded DSL when
        available; otherwise the parsed AST). Round-trip correctness—including
        formula text—is reported in <span className="font-medium">Verification</span>, not here.
        SheetJS write. Filename:{" "}
        <span className="font-mono text-xs">{RECONSTRUCTED_XLSX_FILENAME}</span>.
      </p>

      <div className="mt-4 flex min-h-[5rem] flex-1 flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-col gap-2" aria-hidden data-testid="reconstruction-skeleton">
            <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
          </div>
        ) : null}

        {!isLoading && !workbook ? (
          <p className="text-sm text-muted-foreground">
            Upload a valid .xlsx to enable download.
          </p>
        ) : null}

        {!isLoading && workbook ? (
          <>
            {exportError ? (
              <p
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
                data-testid="reconstruction-export-error"
              >
                {exportError}
              </p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={handleDownload}
              data-testid="reconstruction-download"
            >
              <Download />
              Download reconstructed .xlsx
            </Button>
          </>
        ) : null}
      </div>
    </section>
  );
}
