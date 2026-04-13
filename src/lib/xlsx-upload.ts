/** MIME type commonly used for .xlsx (OOXML). */
export const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Whether a filename looks like an .xlsx workbook (extension only; case-insensitive).
 */
export function isXlsxFileName(name: string): boolean {
  return name.toLowerCase().endsWith(".xlsx");
}

export type XlsxValidation =
  | { ok: true; file: File }
  | { ok: false; message: string };

/**
 * Validate a file from a file input for Phase 2 upload rules.
 */
export function validateXlsxFile(file: File | null | undefined): XlsxValidation {
  if (file == null) {
    return { ok: false, message: "No file selected." };
  }
  if (!isXlsxFileName(file.name)) {
    return {
      ok: false,
      message: "Only .xlsx workbooks are supported. Choose an Excel file.",
    };
  }
  return { ok: true, file };
}
