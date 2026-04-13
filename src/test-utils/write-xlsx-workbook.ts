import * as XLSX from "xlsx";

/** Serialize a SheetJS workbook to an XLSX `ArrayBuffer` (shared by tests). */
export function writeXlsxWorkbookToArrayBuffer(wb: XLSX.WorkBook): ArrayBuffer {
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  if (out instanceof ArrayBuffer) return out;
  if (Array.isArray(out)) return Uint8Array.from(out).buffer;
  if (out instanceof Uint8Array) return new Uint8Array(out).slice().buffer;
  throw new Error("Unexpected XLSX.write output");
}
