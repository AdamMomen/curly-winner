import type { Workbook } from "@/types";

/** Single sheet, one string cell — minimal non-trivial workbook. */
export const FIXTURE_SMALL: Workbook = {
  sheets: [
    {
      name: "S",
      cells: { A1: { address: "A1", type: "string", value: "a" } },
    },
  ],
};

/** Two sheets with values in different corners (order matters). */
export const FIXTURE_MULTI_SHEET: Workbook = {
  sheets: [
    {
      name: "Alpha",
      cells: { A1: { address: "A1", type: "number", value: 1 } },
    },
    {
      name: "Beta",
      cells: { B2: { address: "B2", type: "string", value: "two" } },
    },
  ],
};

/** Large address gap; “blank” cells are simply absent from the map. */
export const FIXTURE_SPARSE: Workbook = {
  sheets: [
    {
      name: "Sparse",
      cells: {
        A1: { address: "A1", type: "number", value: 1 },
        D4: { address: "D4", type: "number", value: 99 },
      },
    },
  ],
};

/** String, number, boolean, and formula on one sheet. */
export const FIXTURE_MIXED_PRIMITIVES: Workbook = {
  sheets: [
    {
      name: "Mix",
      cells: {
        A1: { address: "A1", type: "string", value: "text" },
        A2: { address: "A2", type: "number", value: -3.5 },
        A3: { address: "A3", type: "boolean", value: false },
        A4: { address: "A4", type: "formula", formula: "=1+1", value: 2 },
      },
    },
  ],
};

/** One sheet, no occupied cells (empty-like but still one sheet for parse schema). */
export const FIXTURE_EMPTY_SHEET: Workbook = {
  sheets: [{ name: "Empty", cells: {} }],
};

/** DSL must JSON-encode the sheet name (leading quote breaks “bare” form). */
export const FIXTURE_SHEET_NAME_ESCAPED: Workbook = {
  sheets: [
    {
      name: `"Q1"`,
      cells: { A1: { address: "A1", type: "string", value: "ok" } },
    },
  ],
};

/** Long UTF-16 string in one cell. */
export const FIXTURE_LONG_STRING: Workbook = {
  sheets: [
    {
      name: "S",
      cells: {
        A1: { address: "A1", type: "string", value: "α".repeat(400) },
      },
    },
  ],
};

/** Characters that exercise JSON string escaping in `s:` payloads. */
export const FIXTURE_STRING_SPECIAL_CHARS: Workbook = {
  sheets: [
    {
      name: "S",
      cells: {
        A1: {
          address: "A1",
          type: "string",
          value: `He said "hi"\nline2\\\tend`,
        },
      },
    },
  ],
};

/** Zero sheets — valid for encode / runPipelineStages, not for parse output schema. */
export const FIXTURE_ZERO_SHEETS: Workbook = { sheets: [] };

/** All Phase 17.1 representative ASTs (non-empty parse-compatible). */
export const REPRESENTATIVE_FIXTURES: readonly (readonly [string, Workbook])[] = [
  ["small", FIXTURE_SMALL],
  ["multi_sheet", FIXTURE_MULTI_SHEET],
  ["sparse", FIXTURE_SPARSE],
  ["mixed_primitives", FIXTURE_MIXED_PRIMITIVES],
];
