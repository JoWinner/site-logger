import ExcelJS from "exceljs";

import type { AttendanceStatus } from "@/lib/database.types";

export interface AttendanceExportRow {
  workDate: string;
  employeeName: string;
  siteId: string;
  siteName: string;
  checkInAt: string;
  checkOutAt: string | null;
  workedMinutes: number | null;
  checkInBy: string;
  checkOutBy: string | null;
  overtimeCheck: boolean | null;
  status: AttendanceStatus;
}

export const ATTENDANCE_EXPORT_COLUMNS = [
  { header: "Date", key: "date", width: 14 },
  { header: "Employee Name", key: "employeeName", width: 26 },
  { header: "Job Site", key: "siteName", width: 24 },
  { header: "Check In", key: "checkIn", width: 15 },
  { header: "Check Out", key: "checkOut", width: 15 },
  { header: "Hours", key: "hours", width: 11 },
  { header: "Check In By", key: "checkInBy", width: 26 },
  { header: "Check Out By", key: "checkOutBy", width: 26 },
  { header: "Overtime Check", key: "overtimeCheck", width: 17 },
  { header: "Attendance Status", key: "status", width: 19 },
] as const;

function manualBoolean(value: boolean | null): string | null {
  if (value === null) return null;
  return value ? "Yes" : "No";
}

function safeSheetName(value: string, used: Set<string>): string {
  const base = value.replace(/[\\/*?:[\]]/g, " ").trim().slice(0, 31)
    || "Attendance";
  let name = base;
  let index = 2;
  while (used.has(name.toLowerCase())) {
    const suffix = ` (${index})`;
    name = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    index += 1;
  }
  used.add(name.toLowerCase());
  return name;
}

function addSiteSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  rows: AttendanceExportRow[],
) {
  const sheet = workbook.addWorksheet(name, {
    views: [{ state: "frozen", ySplit: 4 }],
    properties: { defaultRowHeight: 20 },
  });
  sheet.columns = ATTENDANCE_EXPORT_COLUMNS.map((column) => ({
    key: column.key,
    width: column.width,
  }));
  sheet.mergeCells("A1:J1");
  sheet.getCell("A1").value = `${rows[0]?.siteName ?? name} Attendance`;
  sheet.mergeCells("A2:J2");
  sheet.getCell("A2").value =
    "QR attendance export · generated from site-scoped records";
  const header = sheet.getRow(4);
  header.values = ATTENDANCE_EXPORT_COLUMNS.map((column) => column.header);

  for (const item of rows) {
    sheet.addRow({
      date: new Date(`${item.workDate}T00:00:00.000Z`),
      employeeName: item.employeeName,
      siteName: item.siteName,
      checkIn: new Date(item.checkInAt),
      checkOut: item.checkOutAt ? new Date(item.checkOutAt) : null,
      hours:
        item.workedMinutes === null
          ? null
          : Number((item.workedMinutes / 60).toFixed(2)),
      checkInBy: item.checkInBy,
      checkOutBy: item.checkOutBy,
      overtimeCheck: manualBoolean(item.overtimeCheck),
      status: item.status,
    });
  }

  sheet.getCell("A1").style = {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF183F35" } },
    font: {
      name: "Aptos Display",
      size: 20,
      bold: true,
      color: { argb: "FFFFFFFF" },
    },
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

  sheet.autoFilter = { from: "A4", to: "J4" };
  sheet.getColumn(1).numFmt = "yyyy-mm-dd";
  sheet.getColumn(4).numFmt = "h:mm AM/PM";
  sheet.getColumn(5).numFmt = "h:mm AM/PM";
  sheet.getColumn(6).numFmt = "0.00";

  for (let index = 5; index <= sheet.rowCount; index += 1) {
    const row = sheet.getRow(index);
    row.alignment = { vertical: "middle" };
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
}

export async function buildAttendanceWorkbook(
  rows: AttendanceExportRow[],
  selectedSites: { id: string; name: string }[] = [],
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Site Logger";
  workbook.created = new Date();
  workbook.modified = new Date();
  const groups = new Map<string, AttendanceExportRow[]>();
  for (const row of rows) {
    groups.set(row.siteId, [...(groups.get(row.siteId) ?? []), row]);
  }
  const used = new Set<string>();
  const orderedGroups = selectedSites.length
    ? [...selectedSites]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((site) => ({
          siteName: site.name,
          rows: groups.get(site.id) ?? [],
        }))
    : [...groups.values()]
        .map((siteRows) => ({
          siteName: siteRows[0]?.siteName ?? "Attendance",
          rows: siteRows,
        }))
        .sort((a, b) => a.siteName.localeCompare(b.siteName));

  if (!orderedGroups.length) {
    orderedGroups.push({ siteName: "Attendance", rows: [] });
  }
  for (const group of orderedGroups) {
    addSiteSheet(
      workbook,
      safeSheetName(group.siteName, used),
      group.rows,
    );
  }

  return workbook.xlsx.writeBuffer();
}
