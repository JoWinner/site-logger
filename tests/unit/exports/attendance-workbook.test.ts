import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import {
  ATTENDANCE_EXPORT_COLUMNS,
  buildAttendanceWorkbook,
  type AttendanceExportRow,
} from "@/lib/exports/attendance-workbook";

const sample: AttendanceExportRow = {
  workDate: "2026-06-24",
  employeeName: "Luis Rivera",
  siteId: "site-atlas",
  siteName: "Atlas",
  checkInAt: "2026-06-24T07:00:00.000Z",
  checkOutAt: "2026-06-24T17:30:00.000Z",
  workedMinutes: 630,
  checkInBy: "Frank · 77cefe0a",
  checkOutBy: "Frank · 77cefe0a",
  overtimeCheck: null,
  status: "complete",
};

describe("attendance workbook", () => {
  it("uses exactly the approved headings", () => {
    expect(ATTENDANCE_EXPORT_COLUMNS.map((column) => column.header)).toEqual([
      "Date",
      "Employee Name",
      "Job Site",
      "Check In",
      "Check Out",
      "Hours",
      "Check In By",
      "Check Out By",
      "Overtime Check",
      "Attendance Status",
    ]);
  });

  it("creates one worksheet per site with typed hours", async () => {
    const buffer = await buildAttendanceWorkbook([
      sample,
      { ...sample, siteId: "site-dunes", siteName: "The Dunes" },
    ]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as never);

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "Atlas",
      "The Dunes",
    ]);
    expect(workbook.getWorksheet("Atlas")?.getRow(5).getCell(6).value).toBe(10.5);
    expect(workbook.getWorksheet("Atlas")?.getRow(5).getCell(9).value).toBeNull();
  });
});
