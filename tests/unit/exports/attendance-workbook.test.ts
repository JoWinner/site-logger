import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import {
  ATTENDANCE_EXPORT_COLUMNS,
  buildAttendanceWorkbook,
  formatGps,
  type AttendanceExportRow,
} from "@/lib/exports/attendance-workbook";

const sample: AttendanceExportRow = {
  workDate: "2026-06-24",
  employeeName: "Luis Rivera",
  employeeIdPin: null,
  siteName: "Atlas",
  checkInAt: "2026-06-24T07:00:00.000Z",
  checkOutAt: "2026-06-24T17:30:00.000Z",
  workedMinutes: 630,
  checkInLatitude: 64.1466,
  checkInLongitude: -21.9426,
  checkInAccuracyMetres: 18,
  checkOutLatitude: 64.1468,
  checkOutLongitude: -21.9421,
  checkOutAccuracyMetres: 22,
  checkInBy: "Site Keeper",
  checkOutBy: "Site Keeper",
  overtimeCheck: null,
  assignmentCheck: false,
  payrollStatus: null,
  notes: null,
  status: "complete",
};

describe("attendance workbook", () => {
  it("uses the approved A-P heading order", () => {
    expect(ATTENDANCE_EXPORT_COLUMNS.map((column) => column.header)).toEqual([
      "Date",
      "Employee Name",
      "Employee ID / PIN",
      "Job Site",
      "Check In",
      "Check Out",
      "Hours",
      "Check In GPS",
      "Check Out GPS",
      "Check In By",
      "Check Out By",
      "Overtime Check",
      "Assignment Check",
      "Payroll Status",
      "Notes",
      "Attendance Status",
    ]);
  });

  it("formats GPS as coordinates plus accuracy", () => {
    expect(formatGps(64.1466, -21.9426, 18)).toBe(
      "64.146600, -21.942600 (±18 m)",
    );
    expect(formatGps(null, null, null)).toBe("");
  });

  it("keeps optional employee ID and manual fields blank", async () => {
    const buffer = await buildAttendanceWorkbook([sample]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as never);
    const sheet = workbook.getWorksheet("Attendance");

    expect(sheet?.getRow(4).values).toMatchObject({
      1: "Date",
      3: "Employee ID / PIN",
      16: "Attendance Status",
    });
    expect(sheet?.getRow(5).getCell(3).value).toBeNull();
    expect(sheet?.getRow(5).getCell(7).value).toBe(10.5);
    expect(sheet?.getRow(5).getCell(12).value).toBeNull();
    expect(sheet?.getRow(5).getCell(13).value).toBe("No");
  });
});
