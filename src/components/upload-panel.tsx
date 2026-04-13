"use client";

import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { validateXlsxFile } from "@/lib/xlsx-upload";
import { countWorkbookCells, parseXlsxFile } from "@/pipeline";

type ParseInfo =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; sheets: number; cells: number }
  | { status: "error"; message: string };

export function UploadPanel() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const parseGen = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parseInfo, setParseInfo] = useState<ParseInfo>({ status: "idle" });

  function runParse(nextFile: File) {
    const gen = ++parseGen.current;
    setParseInfo({ status: "loading" });
    void parseXlsxFile(nextFile).then((r) => {
      if (parseGen.current !== gen) return;
      if (r.ok) {
        setParseInfo({
          status: "ok",
          sheets: r.workbook.sheets.length,
          cells: countWorkbookCells(r.workbook),
        });
      } else {
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFileList(e.target.files);
  }

  function handleClear() {
    parseGen.current += 1;
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

  return (
    <section className="flex flex-col rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-medium">Upload</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Select a .xlsx file to process. Only Excel Open XML workbooks are
        accepted.
      </p>

      <ul className="mt-3 list-inside list-disc text-sm text-muted-foreground">
        <li>Use the button below or your browser’s file picker.</li>
        <li>Maximum useful size depends on your machine (see PRD for limits).</li>
      </ul>

      <div className="mt-4 flex flex-col gap-3">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={handleChange}
        />
        <div className="flex flex-wrap items-center gap-2">
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
    </section>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
