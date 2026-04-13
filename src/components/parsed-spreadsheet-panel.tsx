"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { colIndexToLetters, encodeA1 } from "@/lib/a1";
import {
  formatCellDisplay,
  getSheetBounds,
} from "@/lib/grid-bounds";
import type { Workbook } from "@/types";

const MAX_GRID_ROWS = 100;
const MAX_GRID_COLS = 40;
const MAX_CELL_CHARS = 80;

type Props = {
  workbook: Workbook | null;
  isParsing: boolean;
};

export function ParsedSpreadsheetPanel({ workbook, isParsing }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const effectiveIndex =
    workbook && workbook.sheets.length > 0
      ? Math.min(activeIndex, workbook.sheets.length - 1)
      : 0;
  const sheet =
    workbook && workbook.sheets.length > 0
      ? (workbook.sheets[effectiveIndex] ?? null)
      : null;

  return (
    <section className="flex flex-col rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-medium">Parsed spreadsheet</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Canonical workbook model after XLSX parse—use this to sanity-check the sheet
        before trusting DSL or token numbers. Only non-empty cells are stored; empty
        grid slots render as a dot.
      </p>

      <div className="mt-4 flex min-h-[12rem] flex-1 flex-col gap-3">
        {isParsing ? <GridSkeleton /> : null}

        {!isParsing && !workbook ? (
          <p className="text-sm text-muted-foreground" data-testid="parsed-empty">
            No preview yet. After a successful parse (see Upload), sheet tabs and the
            cell grid appear here. If you only see a parse error, fix the file and try
            again.
          </p>
        ) : null}

        {!isParsing && workbook ? (
          <>
            <div
              className="flex flex-wrap gap-1.5"
              role="tablist"
              aria-label="Workbook sheets"
            >
              {workbook.sheets.map((s, i) => (
                <Button
                  key={`${i}-${s.name}`}
                  type="button"
                  role="tab"
                  aria-selected={i === effectiveIndex}
                  size="sm"
                  variant={i === effectiveIndex ? "default" : "outline"}
                  className="h-8 max-w-[10rem] truncate"
                  title={s.name}
                  onClick={() => setActiveIndex(i)}
                >
                  {s.name}
                </Button>
              ))}
            </div>

            {sheet ? <SheetGrid sheet={sheet} /> : null}
          </>
        ) : null}
      </div>
    </section>
  );
}

function GridSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-40 w-full animate-pulse rounded-md bg-muted/70" />
      <p className="text-xs text-muted-foreground">Parsing workbook…</p>
    </div>
  );
}

function SheetGrid({ sheet }: { sheet: Workbook["sheets"][number] }) {
  const bounds = getSheetBounds(sheet);

  if (!bounds) {
    return (
      <p className="text-sm text-muted-foreground">
        No non-empty cells in this sheet.
      </p>
    );
  }

  const {
    minRow,
    maxRow,
    minCol,
    maxCol,
    displayMinRow,
    displayMaxRow,
    displayMinCol,
    displayMaxCol,
    truncatedRows,
    truncatedCols,
  } = clampBounds(bounds);

  const rowCount = displayMaxRow - displayMinRow + 1;
  const colCount = displayMaxCol - displayMinCol + 1;

  return (
    <div className="flex flex-col gap-2">
      {(truncatedRows || truncatedCols) && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Large sheet truncated for performance: showing {rowCount}×{colCount}{" "}
          of used range ({maxRow - minRow + 1} rows × {maxCol - minCol + 1}{" "}
          cols). Increase limits in code if needed.
        </p>
      )}

      <div className="max-h-[min(70vh,560px)] overflow-auto rounded-md border border-border">
        <table className="w-max border-collapse text-left text-xs tabular-nums">
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
            <tr>
              <th className="border border-border bg-muted px-2 py-1.5 font-medium text-muted-foreground">
                {" "}
              </th>
              {Array.from({ length: colCount }, (_, i) => displayMinCol + i).map(
                (c) => (
                  <th
                    key={c}
                    className="border border-border bg-muted px-2 py-1.5 font-medium text-muted-foreground"
                  >
                    {colIndexToLetters(c)}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }, (_, i) => displayMinRow + i).map(
              (r) => (
                <tr key={r}>
                  <th className="border border-border bg-muted/80 px-2 py-1 text-right font-medium text-muted-foreground">
                    {r + 1}
                  </th>
                  {Array.from(
                    { length: colCount },
                    (_, j) => displayMinCol + j
                  ).map((c) => {
                    const addr = encodeA1(r, c);
                    const cell = sheet.cells[addr];
                    const display = cell ? formatCellDisplay(cell) : "";
                    const clipped =
                      display.length > MAX_CELL_CHARS
                        ? `${display.slice(0, MAX_CELL_CHARS)}…`
                        : display;
                    return (
                      <td
                        key={addr}
                        className="max-w-[14rem] border border-border px-2 py-1 align-top"
                        title={cell ? formatCellDisplay(cell) : undefined}
                      >
                        {cell ? (
                          <span className="break-words text-foreground">
                            {clipped}
                          </span>
                        ) : (
                          <span
                            className="text-muted-foreground/50"
                            aria-label="Empty"
                          >
                            ·
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function clampBounds(bounds: {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
}) {
  const rowSpan = bounds.maxRow - bounds.minRow + 1;
  const colSpan = bounds.maxCol - bounds.minCol + 1;
  const truncatedRows = rowSpan > MAX_GRID_ROWS;
  const truncatedCols = colSpan > MAX_GRID_COLS;
  return {
    ...bounds,
    displayMinRow: bounds.minRow,
    displayMaxRow: truncatedRows
      ? bounds.minRow + MAX_GRID_ROWS - 1
      : bounds.maxRow,
    displayMinCol: bounds.minCol,
    displayMaxCol: truncatedCols
      ? bounds.minCol + MAX_GRID_COLS - 1
      : bounds.maxCol,
    truncatedRows,
    truncatedCols,
  };
}
