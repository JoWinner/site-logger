import { Readable } from "node:stream";

import ExcelJS from "exceljs";

import {
  getCanonicalHeader,
  hasRequiredHeaders,
} from "@/lib/imports/headers";
import type { ImportEntity, ParsedImportRow } from "@/lib/imports/types";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_DATA_ROWS = 2_000;
const HEADER_SCAN_ROWS = 25;

function cellValue(value: ExcelJS.CellValue): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "object") return String(value).trim() || null;

  if ("result" in value) {
    return cellValue(value.result as ExcelJS.CellValue);
  }
  if ("richText" in value) {
    return value.richText.map((part) => part.text).join("").trim() || null;
  }
  if ("text" in value) {
    return String(value.text).trim() || null;
  }

  return String(value).trim() || null;
}

function findHeaderRow(
  sheet: ExcelJS.Worksheet,
  entity: ImportEntity,
): { rowNumber: number; columns: Map<number, string> } {
  const lastRow = Math.min(sheet.rowCount, HEADER_SCAN_ROWS);

  for (let rowNumber = 1; rowNumber <= lastRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const columns = new Map<number, string>();

    row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
      const canonical = getCanonicalHeader(entity, cellValue(cell.value));
      if (canonical && ![...columns.values()].includes(canonical)) {
        columns.set(columnNumber, canonical);
      }
    });

    if (hasRequiredHeaders(entity, columns.values())) {
      return { rowNumber, columns };
    }
  }

  throw new Error(
    entity === "employees"
      ? "Employee file needs an Employee Name or Full Name column."
      : "Site file needs Site Code and Site Name columns.",
  );
}

function readRows(
  sheet: ExcelJS.Worksheet,
  entity: ImportEntity,
): ParsedImportRow[] {
  const header = findHeaderRow(sheet, entity);
  const rows: ParsedImportRow[] = [];

  for (
    let rowNumber = header.rowNumber + 1;
    rowNumber <= sheet.rowCount;
    rowNumber += 1
  ) {
    const row = sheet.getRow(rowNumber);
    const values: Record<string, unknown> = {};

    for (const [columnNumber, key] of header.columns) {
      values[key] = cellValue(row.getCell(columnNumber).value);
    }

    if (Object.values(values).every((value) => value === null)) continue;
    rows.push({ rowNumber, values });

    if (rows.length > MAX_DATA_ROWS) {
      throw new Error(`Import files are limited to ${MAX_DATA_ROWS} data rows.`);
    }
  }

  return rows;
}

export async function parseImportFile(
  file: File,
  entity: ImportEntity,
): Promise<ParsedImportRow[]> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Import files must be 5 MB or smaller.");
  }

  const extension = file.name.toLowerCase().split(".").pop();
  const workbook = new ExcelJS.Workbook();

  if (extension === "xlsx") {
    await workbook.xlsx.load(await file.arrayBuffer());
  } else if (extension === "csv") {
    const csv = Buffer.from(await file.arrayBuffer()).toString("utf8");
    await workbook.csv.read(Readable.from([csv]));
  } else {
    throw new Error("Choose a .csv or .xlsx file.");
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("The import file does not contain a worksheet.");

  return readRows(sheet, entity);
}
