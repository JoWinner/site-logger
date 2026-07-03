import ExcelJS from "exceljs";

import type { AttendanceStatus, PayrollStatus } from "@/lib/database.types";

export interface AttendanceExportRow {
  workDate: string;
  employeeName: string;
  employeeIdPin: string | null;
  siteName: string;
  checkInAt: string;
  checkOutAt: string | null;
  workedMinutes: number | null;
  checkInLatitude: number;
  checkInLongitude: number;
  checkInAccuracyMetres: number;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
  checkOutAccuracyMetres: number | null;
  checkInBy: string;
  checkOutBy: string | null;
  overtimeCheck: boolean | null;
  assignmentCheck: boolean | null;
  payrollStatus: PayrollStatus | null;
  notes: string | null;
  status: AttendanceStatus;
}

export const ATTENDANCE_EXPORT_COLUMNS = [
  { header: "Date", key: "date", width: 14 },
  { header: "Employee Name", key: "employeeName", width: 24 },
  { header: "Employee ID / PIN", key: "employeeIdPin", width: 19 },
  { header: "Job Site", key: "siteName", width: 24 },
  { header: "Check In", key: "checkIn", width: 13 },
  { header: "Check Out", key: "checkOut", width: 13 },
  { header: "Hours", key: "hours", width: 11 },
  { header: "Check In GPS", key: "checkInGps", width: 35 },
  { header: "Check Out GPS", key: "checkOutGps", width: 35 },
  { header: "Check In By", key: "checkInBy", width: 22 },
  { header: "Check Out By", key: "checkOutBy", width: 22 },
  { header: "Overtime Check", key: "overtimeCheck", width: 17 },
  { header: "Assignment Check", key: "assignmentCheck", width: 18 },
  { header: "Payroll Status", key: "payrollStatus", width: 17 },
  { header: "Notes", key: "notes", width: 42 },
  { header: "Attendance Status", key: "status", width: 19 },
] as const;

export function formatGps(
  latitude: number | null,
  longitude: number | null,
  accuracyMetres: number | null,
): string {
  if (latitude === null || longitude === null || accuracyMetres === null) {
    return "";
  }
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracyMetres)} m)`;
}

function manualBoolean(value: boolean | null): string | null {
  if (value === null) return null;
  return value ? "Yes" : "No";
}

export async function buildAttendanceWorkbook(
  rows: AttendanceExportRow[],
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Site Logger";
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet("Attendance", {
    views: [{ state: "frozen", ySplit: 4 }],
    properties: { defaultRowHeight: 20 },
  });
  sheet.columns = ATTENDANCE_EXPORT_COLUMNS.map((column) => ({
    key: column.key,
    width: column.width,
  }));
  sheet.mergeCells("A1:P1");
  sheet.getCell("A1").value = "Worker Attendance Check-In";
  sheet.mergeCells("A2:P2");
  sheet.getCell("A2").value =
    "GPS-evidenced QR attendance · optional fields remain blank until manually entered";

  const header = sheet.getRow(4);
  header.values = ATTENDANCE_EXPORT_COLUMNS.map((column) => column.header);

  for (const item of rows) {
    sheet.addRow({
      date: new Date(`${item.workDate}T00:00:00.000Z`),
      employeeName: item.employeeName,
      employeeIdPin: item.employeeIdPin,
      siteName: item.siteName,
      checkIn: new Date(item.checkInAt),
      checkOut: item.checkOutAt ? new Date(item.checkOutAt) : null,
      hours:
        item.workedMinutes === null
          ? null
          : Number((item.workedMinutes / 60).toFixed(2)),
      checkInGps: formatGps(
        item.checkInLatitude,
        item.checkInLongitude,
        item.checkInAccuracyMetres,
      ),
      checkOutGps: formatGps(
        item.checkOutLatitude,
        item.checkOutLongitude,
        item.checkOutAccuracyMetres,
      ),
      checkInBy: item.checkInBy,
      checkOutBy: item.checkOutBy,
      overtimeCheck: manualBoolean(item.overtimeCheck),
      assignmentCheck: manualBoolean(item.assignmentCheck),
      payrollStatus: item.payrollStatus?.replace("_", " ") ?? null,
      notes: item.notes,
      status: item.status,
    });
  }

  sheet.getCell("A1").style = {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF183F35" } },
    font: { name: "Aptos Display", size: 20, bold: true, color: { argb: "FFFFFFFF" } },
    alignment: { vertical: "middle", horizontal: "center" },
  };
  sheet.getRow(1).height = 34;
  sheet.getCell("A2").style = {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCE7E2" } },
    font: { name: "Aptos", size: 11, color: { argb: "FF183F35" } },
    alignment: { vertical: "middle", horizontal: "center" },
  };
  sheet.getRow(2).height = 26;
  header.height = 28;
  header.eachCell((cell) => {
    cell.style = {
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF14251F" } },
      font: { name: "Aptos", size: 10, bold: true, color: { argb: "FFFFFFFF" } },
      alignment: { vertical: "middle", horizontal: "center", wrapText: true },
      border: {
        bottom: { style: "thin", color: { argb: "FFEF6A2E" } },
      },
    };
  });

  sheet.autoFilter = { from: "A4", to: "P4" };
  sheet.getColumn(1).numFmt = "yyyy-mm-dd";
  sheet.getColumn(5).numFmt = "h:mm AM/PM";
  sheet.getColumn(6).numFmt = "h:mm AM/PM";
  sheet.getColumn(7).numFmt = "0.00";

  for (let index = 5; index <= sheet.rowCount; index += 1) {
    const row = sheet.getRow(index);
    row.alignment = { vertical: "middle" };
    row.getCell(15).alignment = { vertical: "middle", wrapText: true };
    if (row.getCell(15).value) row.height = 34;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFD5D0C4" } },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: index % 2 === 0 ? "FFF5F0E5" : "FFFFFEF8" },
      };
    });
  }

  return workbook.xlsx.writeBuffer();
}
