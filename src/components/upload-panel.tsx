"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import type { UploadPipelineSummary } from "@/lib/lab-state";
import { validateXlsxFile } from "@/lib/xlsx-upload";

export type UploadPanelProps = {
  /** Called after a file passes client-side .xlsx validation. Parent runs {@link runPipeline}. */
  onFileAccepted?: (file: File) => void;
  /** Clear parent pipeline state (Remove, invalid file, or stale run cancellation). */
  onLabClear?: () => void;
  isPipelineBusy?: boolean;
  pipelineSummary?: UploadPipelineSummary;
};

export function UploadPanel({
  onFileAccepted,
  onLabClear,
  isPipelineBusy = false,
  pipelineSummary = { status: "idle" },
}: UploadPanelProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const handleFileListRef = useRef<(list: FileList | null) => void>(() => {});

  function handleFileList(list: FileList | null) {
    const next = list?.[0] ?? null;
    if (next == null) {
      setError(null);
      return;
    }
    const result = validateXlsxFile(next);
    if (!result.ok) {
      onLabClear?.();
      setFile(null);
      setError(result.message);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }
    setError(null);
    setFile(result.file);
    onFileAccepted?.(result.file);
  }

  useEffect(() => {
    handleFileListRef.current = handleFileList;
  });

  useEffect(() => {
    let fileDragDepth = 0;

    function hasFiles(dt: DataTransfer | null): boolean {
      return dt?.types?.includes("Files") ?? false;
    }

    function syncDragOverlay() {
      setIsDragOver(fileDragDepth > 0);
    }

    function onDragEnter(e: DragEvent) {
      if (!hasFiles(e.dataTransfer)) return;
      e.preventDefault();
      fileDragDepth += 1;
      syncDragOverlay();
    }

    function onDragLeave(e: DragEvent) {
      e.preventDefault();
      if (e.relatedTarget == null && fileDragDepth > 0) {
        fileDragDepth = 0;
        syncDragOverlay();
        return;
      }
      if (fileDragDepth <= 0) return;
      fileDragDepth -= 1;
      if (fileDragDepth <= 0) {
        fileDragDepth = 0;
        syncDragOverlay();
      }
    }

    function onDragOver(e: DragEvent) {
      const dt = e.dataTransfer;
      if (dt == null || !hasFiles(dt)) return;
      e.preventDefault();
      dt.dropEffect = "copy";
    }

    function onDrop(e: DragEvent) {
      const dt = e.dataTransfer;
      if (dt == null || !hasFiles(dt)) return;
      e.preventDefault();
      fileDragDepth = 0;
      syncDragOverlay();
      handleFileListRef.current(dt.files);
    }

    document.addEventListener("dragenter", onDragEnter);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragenter", onDragEnter);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("drop", onDrop);
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFileList(e.target.files);
  }

  function handleClear() {
    onLabClear?.();
    setFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handlePickClick() {
    inputRef.current?.click();
  }

  const pageDropOverlay =
    typeof document !== "undefined" && isDragOver
      ? createPortal(
          <div
            className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-background/85 backdrop-blur-[2px]"
            aria-hidden
          >
            <p className="mx-4 max-w-md rounded-lg border-2 border-dashed border-primary bg-card px-8 py-6 text-center text-base font-medium text-foreground shadow-lg">
              Drop a .xlsx workbook anywhere to upload
            </p>
          </div>,
          document.body,
        )
      : null;

  const showLoading = isPipelineBusy || pipelineSummary.status === "loading";

  return (
    <section className="flex flex-col rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-medium">Upload</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Select a .xlsx file to process. Only Excel Open XML workbooks are
        accepted.
      </p>

      <ul className="mt-3 list-inside list-disc text-sm text-muted-foreground">
        <li>Drag and drop a .xlsx anywhere on this page, or use the button.</li>
        <li>Maximum useful size depends on your machine (see PRD for limits).</li>
      </ul>

      {pageDropOverlay}

      <div className="mt-4 flex flex-col gap-3">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={handleChange}
        />
        <div
          role="region"
          aria-label="Upload controls; you can also drop a .xlsx anywhere on the page"
          className="flex flex-col gap-3 rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-4"
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="button" onClick={handlePickClick}>
              {file ? "Replace file…" : "Choose .xlsx file…"}
            </Button>
            {file ? (
              <Button type="button" variant="outline" onClick={handleClear}>
                Remove
              </Button>
            ) : null}
          </div>

          {file ? (
            <p className="text-sm text-foreground">
              <span className="font-medium">Selected:</span>{" "}
              <span className="break-all">{file.name}</span>
              <span className="text-muted-foreground">
                {" "}
                ({formatBytes(file.size)})
              </span>
            </p>
          ) : null}

          {error ? (
            <p
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {showLoading ? (
            <p className="text-sm text-muted-foreground">Running pipeline…</p>
          ) : null}
          {pipelineSummary.status === "ok" ? (
            <p className="text-sm text-foreground">
              <span className="font-medium">AST preview:</span>{" "}
              {pipelineSummary.sheets} sheet
              {pipelineSummary.sheets === 1 ? "" : "s"}, {pipelineSummary.cells}{" "}
              non-empty cell{pipelineSummary.cells === 1 ? "" : "s"} (validated).
            </p>
          ) : null}
          {pipelineSummary.status === "error" ? (
            <p
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              Parse failed: {pipelineSummary.message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
