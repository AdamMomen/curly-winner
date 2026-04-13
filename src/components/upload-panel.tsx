"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { validateXlsxFile } from "@/lib/xlsx-upload";
import { countWorkbookCells, parseXlsxFile } from "@/pipeline";
import type { Workbook } from "@/types";

type ParseInfo =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; sheets: number; cells: number }
  | { status: "error"; message: string };

export type UploadPanelProps = {
  onWorkbookChange?: (workbook: Workbook | null) => void;
  onParsingChange?: (parsing: boolean) => void;
};

export function UploadPanel({
  onWorkbookChange,
  onParsingChange,
}: UploadPanelProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const parseGen = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parseInfo, setParseInfo] = useState<ParseInfo>({ status: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);
  const handleFileListRef = useRef<(list: FileList | null) => void>(() => {});

  function runParse(nextFile: File) {
    const gen = ++parseGen.current;
    onParsingChange?.(true);
    setParseInfo({ status: "loading" });
    void parseXlsxFile(nextFile).then((r) => {
      if (parseGen.current !== gen) return;
      onParsingChange?.(false);
      if (r.ok) {
        onWorkbookChange?.(r.workbook);
        setParseInfo({
          status: "ok",
          sheets: r.workbook.sheets.length,
          cells: countWorkbookCells(r.workbook),
        });
      } else {
        onWorkbookChange?.(null);
        setParseInfo({ status: "error", message: r.error });
      }
    });
  }

  function handleFileList(list: FileList | null) {
    const next = list?.[0] ?? null;
    if (next == null) {
      setError(null);
      return;
    }
    const result = validateXlsxFile(next);
    if (!result.ok) {
      parseGen.current += 1;
      onParsingChange?.(false);
      onWorkbookChange?.(null);
      setFile(null);
      setParseInfo({ status: "idle" });
      setError(result.message);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }
    setError(null);
    setFile(result.file);
    runParse(result.file);
  }

  handleFileListRef.current = handleFileList;

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
      if (!hasFiles(e.dataTransfer)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }

    function onDrop(e: DragEvent) {
      if (!hasFiles(e.dataTransfer)) return;
      e.preventDefault();
      fileDragDepth = 0;
      syncDragOverlay();
      handleFileListRef.current(e.dataTransfer.files);
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
    parseGen.current += 1;
    onParsingChange?.(false);
    onWorkbookChange?.(null);
    setFile(null);
    setError(null);
    setParseInfo({ status: "idle" });
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
          <p className="text-center text-sm text-muted-foreground">
            Or drop on the page — full-window overlay appears while dragging
          </p>
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

          {parseInfo.status === "loading" ? (
            <p className="text-sm text-muted-foreground">Parsing workbook…</p>
          ) : null}
          {parseInfo.status === "ok" ? (
            <p className="text-sm text-foreground">
              <span className="font-medium">AST preview:</span>{" "}
              {parseInfo.sheets} sheet
              {parseInfo.sheets === 1 ? "" : "s"}, {parseInfo.cells} non-empty
              cell{parseInfo.cells === 1 ? "" : "s"} (validated).
            </p>
          ) : null}
          {parseInfo.status === "error" ? (
            <p
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              Parse failed: {parseInfo.message}
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
