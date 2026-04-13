"use client";

import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { validateXlsxFile } from "@/lib/xlsx-upload";

export function UploadPanel() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileList(list: FileList | null) {
    const next = list?.[0] ?? null;
    if (next == null) {
      setError(null);
      return;
    }
    const result = validateXlsxFile(next);
    if (!result.ok) {
      setFile(null);
      setError(result.message);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }
    setError(null);
    setFile(result.file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFileList(e.target.files);
  }

  function handleClear() {
    setFile(null);
    setError(null);
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
      </div>
    </section>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
