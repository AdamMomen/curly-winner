"use client";

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
        Estimated tokens (~4 UTF-16 chars per token). Baseline is the largest of JSON,
        CSV, and approximate XML—see docs/token-counting.md.
      </p>

      <div className="mt-4 flex min-h-[10rem] flex-1 flex-col gap-3">
        {isLoading ? <AnalyticsSkeleton /> : null}

        {!isLoading && !report ? (
          <p className="text-sm text-muted-foreground">
            Upload a valid .xlsx to compare format sizes here.
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
              <table className="w-full min-w-[28rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left">
                    <th className="px-3 py-2 font-medium">Format</th>
                    <th className="px-3 py-2 font-medium tabular-nums">Est. tokens</th>
                    <th className="px-3 py-2 font-medium tabular-nums">% of baseline</th>
                    <th className="px-3 py-2 font-medium tabular-nums">Δ vs baseline</th>
                  </tr>
                </thead>
                <tbody>
                  {TOKEN_FORMAT_IDS.map((id) => {
                    const isBest = id === bestId;
                    const isDsl = id === "dsl";
                    const tokens = report.tokenCounts[id];
                    const pct = report.pctOfReference[id];
                    const delta = report.reductionVsReferencePct[id];
                    return (
                      <tr
                        key={id}
                        data-format={id}
                        className={
                          isBest
                            ? "bg-primary/10 ring-1 ring-inset ring-primary/25"
                            : isDsl
                              ? "bg-muted/25"
                              : "border-b border-border/80"
                        }
                      >
                        <td className="px-3 py-2 font-medium">
                          {FORMAT_LABELS[id]}
                          {isBest ? (
                            <span className="ml-2 text-xs font-normal text-primary">
                              lowest
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          {tokens.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-muted-foreground">
                          {Math.round(pct)}%
                        </td>
                        <td
                          className={
                            delta > 0
                              ? "px-3 py-2 tabular-nums text-emerald-700 dark:text-emerald-400"
                              : "px-3 py-2 tabular-nums text-muted-foreground"
                          }
                        >
                          {delta > 0 ? "−" : ""}
                          {Math.abs(Math.round(delta))}%
                          {delta > 0 ? " saved" : delta < 0 ? " over" : ""}
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

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden data-testid="token-analytics-skeleton">
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-32 w-full animate-pulse rounded-md bg-muted/80" />
    </div>
  );
}
