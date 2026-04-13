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
    };

export type CellType = Cell["type"];

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
