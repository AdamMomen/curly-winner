/**
 * Approximate token estimate (see docs/token-counting.md).
 * Same input always yields the same integer.
 */

/** Documented divisor for the chars-per-token heuristic. */
export const APPROX_CHARS_PER_TOKEN = 4 as const;

/**
 * Deterministic token estimate from a string (UTF-16 code units).
 * Empty string → 0.
 */
export function estimateTokenCount(text: string): number {
  if (text.length === 0) return 0;
  return Math.ceil(text.length / APPROX_CHARS_PER_TOKEN);
}
