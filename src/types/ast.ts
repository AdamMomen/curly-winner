/**
 * Canonical workbook AST (v1).
 * Parser output and decoder target share this shape.
 */

/** Excel-style A1 address, uppercase column letters (e.g. `A1`, `B2`, `AA10`). */
export type CellAddress = string;

/** Supported primitive cell values (non-empty cells only). */
export type CellValue = string | number | boolean;

/** One occupied cell in a sheet (discriminated by `type` for safe narrowing). */
export type Cell =
  | {
      readonly address: CellAddress;
      readonly type: "string";
      readonly value: string;
    }
  | {
      readonly address: CellAddress;
      readonly type: "number";
      readonly value: number;
    }
  | {
      readonly address: CellAddress;
      readonly type: "boolean";
      readonly value: boolean;
    }
  | {
      readonly address: CellAddress;
      readonly type: "formula";
      /** Formula as returned by the XLSX reader (e.g. SheetJS `f`, often without a leading `=`). */
      readonly formula: string;
      /** Cached result (evaluated value) for display, export, and verification. */
      readonly value: CellValue;
    };

export type CellType = Cell["type"];

/**
 * Cell payload without `address` (parser/decoder internals).
 * Declared explicitly because `Omit<Cell, "address">` does not preserve narrowing in TS.
 */
export type CellBody =
  | { type: "string"; value: string }
  | { type: "number"; value: number }
  | { type: "boolean"; value: boolean }
  | { type: "formula"; formula: string; value: CellValue };

/**
 * One sheet. `cells` is sparse: only non-empty cells appear.
 * An empty cell is represented by omitting its address from `cells`.
 */
export interface Sheet {
  readonly name: string;
  readonly cells: Readonly<Record<CellAddress, Cell>>;
}

/** Ordered workbook: sheet order matches source workbook order (first sheet first). */
export interface Workbook {
  readonly sheets: readonly Sheet[];
}
