/**0-based column index from Excel letters (A → 0, Z → 25, AA → 26). */
export function lettersToColIndex(letters: string): number {
  let result = 0;
  for (let i = 0; i < letters.length; i++) {
    result = result * 26 + (letters.charCodeAt(i) - 64);
  }
  return result - 1;
}

/** 0-based row and column from A1 address (e.g. A1 → row0, col 0). */
export function decodeA1(address: string): { row: number; col: number } {
  const m = address.match(/^([A-Z]+)([1-9][0-9]*)$/);
  if (!m) {
    throw new Error(`Invalid A1 address: ${address}`);
  }
  return {
    col: lettersToColIndex(m[1]),
    row: Number.parseInt(m[2], 10) - 1,
  };
}

/** Column index to Excel letters (0 → A). */
export function colIndexToLetters(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** A1 address from 0-based row and column. */
export function encodeA1(row: number, col: number): string {
  return `${colIndexToLetters(col)}${row + 1}`;
}
