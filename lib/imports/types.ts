import type { EmployeeInput } from "@/lib/validation/employee";
import type { SiteInput } from "@/lib/validation/site";

export type ImportEntity = "employees" | "sites";
export type ImportDisposition = "new" | "update" | "warning" | "error";
export type ImportValue = EmployeeInput | SiteInput;

export interface ParsedImportRow {
  rowNumber: number;
  values: Record<string, unknown>;
}

export interface ImportPreviewRow<T extends ImportValue = ImportValue> {
  rowNumber: number;
  disposition: ImportDisposition;
  value: T | null;
  messages: string[];
}

export interface ImportPreview<T extends ImportValue = ImportValue> {
  rows: ImportPreviewRow<T>[];
  summary: {
    total: number;
    new: number;
    update: number;
    warning: number;
    error: number;
  };
}

export function summarizeImport<T extends ImportValue>(
  rows: ImportPreviewRow<T>[],
): ImportPreview<T> {
  return {
    rows,
    summary: {
      total: rows.length,
      new: rows.filter((row) => row.disposition === "new").length,
      update: rows.filter((row) => row.disposition === "update").length,
      warning: rows.filter((row) => row.disposition === "warning").length,
      error: rows.filter((row) => row.disposition === "error").length,
    },
  };
}
