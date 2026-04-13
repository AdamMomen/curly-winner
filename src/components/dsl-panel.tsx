"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

/** Collapsed view shows this many complete lines; remainder hidden until expanded. */
export const DSL_PANEL_COLLAPSE_MAX_LINES = 20;

type Props = {
  /** Encoded XLSXDSL1 text, or null when no workbook / not ready. */
  dsl: string | null;
  encodeError: string | null;
  isLoading: boolean;
};

export function DslPanel({ dsl, encodeError, isLoading }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  const lines = dsl ? dsl.split("\n") : [];
  const isLong = lines.length > DSL_PANEL_COLLAPSE_MAX_LINES;
  const displayText =
    dsl && isLong && !expanded
      ? `${lines.slice(0, DSL_PANEL_COLLAPSE_MAX_LINES).join("\n")}\n…`
      : dsl;

  async function handleCopy() {
    if (!dsl) return;
    try {
      await navigator.clipboard.writeText(dsl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="flex flex-col rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-medium">Encoded DSL</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Lossless-style encoding of the same AST the grid shows (header{" "}
        <span className="font-mono text-xs">XLSXDSL1 v1</span>, then sheet blocks and
        cell lines). Whitespace in strings is preserved via JSON quoting.
      </p>

      <div className="mt-4 flex min-h-[10rem] flex-1 flex-col gap-3">
        {isLoading ? <DslSkeleton /> : null}

        {!isLoading && !dsl && !encodeError ? (
          <p className="text-sm text-muted-foreground" data-testid="dsl-empty">
            No DSL yet. The encoder runs after parse; if the AST is invalid for encoding,
            you will see an error above instead of text here.
          </p>
        ) : null}

        {!isLoading && encodeError ? (
          <p
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            Encoding failed: {encodeError}
          </p>
        ) : null}

        {!isLoading && dsl ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleCopy()}
                disabled={!dsl}
              >
                {copied ? (
                  <>
                    <Check />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy />
                    Copy
                  </>
                )}
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                {dsl.length} character{dsl.length === 1 ? "" : "s"}
              </span>
              {isLong ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-muted-foreground"
                  onClick={() => setExpanded((e) => !e)}
                >
                  {expanded ? "Show less" : "Show all"}
                </Button>
              ) : null}
            </div>
            <div className="max-h-[min(24rem,50vh)] min-h-[8rem] overflow-auto rounded-md border border-border bg-muted/40">
              <pre
                className="p-3 font-mono text-xs leading-relaxed whitespace-pre text-foreground"
                data-testid="dsl-panel-pre"
              >
                {displayText}
              </pre>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function DslSkeleton() {
  return (
    <div
      className="flex flex-col gap-2"
      aria-hidden
      data-testid="dsl-panel-skeleton"
    >
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="min-h-[8rem] rounded-md border border-dashed border-muted-foreground/20 bg-muted/30 p-3">
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-[92%] animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
