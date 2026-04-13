/**
 * Golden XLSXDSL1 example documents (must match docs/xlsx-dsl1-spec.md §7).
 */

export const XLSXDSL1_EXAMPLE_MINIMAL = `XLSXDSL1 v1

sheet Summary
A1 s:"Total"
B1 n:100
`;

export const XLSXDSL1_EXAMPLE_MULTI_SHEET = `XLSXDSL1 v1

sheet Summary
A1 s:"Total"

---

sheet Details
Z99 b:true
`;

export const XLSXDSL1_EXAMPLE_SPARSE = `XLSXDSL1 v1

sheet Data
A1 s:"corner"
C3 n:-2.5
AA10 b:false
`;

export const XLSXDSL1_EXAMPLE_EMPTY_WORKBOOK = `XLSXDSL1 v1
`;
