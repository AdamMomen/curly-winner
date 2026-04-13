"use client";

import { Crown } from "lucide-react";

import {
  FORMAT_LABELS,
  TOKEN_FORMAT_IDS,
  buildAnalyticsSummarySentence,
  pickBestFormatId,
  type TokenReport,
} from "@/tokens";

export type TokenAnalyticsPanelProps = {
  report: (TokenReport & { encodeError: string | null }) | null;
  isLoading: boolean;
};

export function TokenAnalyticsPanel({ report, isLoading }: TokenAnalyticsPanelProps) {
  const bestId = report ? pickBestFormatId(report) : null;

  return (
    <section className="flex flex-col rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-medium">Token analytics</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Rough token estimates (~4 UTF-16 code units per token; see docs/token-counting.md).
        Loss % is how much of the workbook each serialized form fails to preserve (CSV is
        values-only, so formula text counts as lost there).
      </p>

      <div className="mt-4 flex min-h-[10rem] flex-1 flex-col gap-3">
        {isLoading ? <AnalyticsSkeleton /> : null}

        {!isLoading && !report ? (
          <p className="text-sm text-muted-foreground" data-testid="token-analytics-empty">
            No analytics yet. The table fills in once the pipeline has a parsed workbook
            (and DSL text when encoding succeeds).
          </p>
        ) : null}

        {!isLoading && report ? (
          <>
            {report.encodeError ? (
              <p
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                DSL encoding issue (counts may be off): {report.encodeError}
              </p>
            ) : null}

            <p
              className="rounded-md border border-primary/25 bg-primary/5 px-3 py-2 text-sm text-foreground"
              data-testid="token-analytics-summary"
            >
              {buildAnalyticsSummarySentence(report)}
            </p>

            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[20rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left">
                    <th className="px-3 py-2 font-medium">Format</th>
                    <th className="px-3 py-2 font-medium tabular-nums">Est. tokens</th>
                    <th className="px-3 py-2 font-medium tabular-nums">Loss %</th>
                  </tr>
                </thead>
                <tbody>
                  {TOKEN_FORMAT_IDS.map((id) => {
                    const isBest = id === bestId;
                    const isDsl = id === "dsl";
                    const tokens = report.tokenCounts[id];
                    const loss = report.lossPctByFormat[id];
                    return (
                      <tr
                        key={id}
                        data-format={id}
                        data-testid={isDsl ? "token-format-row-dsl" : undefined}
                        className={
                          isDsl
                            ? "border-b border-amber-200/60 bg-gradient-to-r from-amber-50/95 via-amber-50/70 to-amber-100/40 ring-1 ring-inset ring-amber-400/45 dark:border-amber-900/50 dark:from-amber-950/40 dark:via-amber-950/25 dark:to-amber-900/15 dark:ring-amber-500/35"
                            : "border-b border-border/80"
                        }
                      >
                        <td className="px-3 py-2 font-medium">
                          <span className="inline-flex flex-wrap items-center gap-2">
                            {isDsl ? (
                              <Crown
                                className="h-4 w-4 shrink-0 text-amber-500 drop-shadow-sm dark:text-amber-400"
                                strokeWidth={1.75}
                                aria-label="Winner encoding"
                              />
                            ) : null}
                            {FORMAT_LABELS[id]}
                            {isDsl ? (
                              <span className="rounded-md border border-amber-400/50 bg-amber-400/15 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
                                Winner
                              </span>
                            ) : null}
                            {isBest && !isDsl ? (
                              <span className="text-xs font-normal text-muted-foreground">
                                lowest tokens
                              </span>
                            ) : null}
                          </span>
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          {tokens.toLocaleString()}
                        </td>
                        <td
                          data-testid={`token-loss-${id}`}
                          className={
                            loss > 0
                              ? "px-3 py-2 tabular-nums text-amber-800 dark:text-amber-400"
                              : "px-3 py-2 tabular-nums text-muted-foreground"
                          }
                        >
                          {formatSemanticLossPct(loss)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function formatSemanticLossPct(p: number): string {
  if (p === 0) return "0%";
  const rounded = Math.round(p * 10) / 10;
  return `${rounded}%`;
}

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden data-testid="token-analytics-skeleton">
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-32 w-full animate-pulse rounded-md bg-muted/80" />
    </div>
  );
}
