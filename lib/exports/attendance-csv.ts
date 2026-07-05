import {
  ATTENDANCE_EXPORT_COLUMNS,
  type AttendanceExportRow,
} from "@/lib/exports/attendance-workbook";

function escapeCsv(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildAttendanceCsv(rows: AttendanceExportRow[]): string {
  const sorted = [...rows].sort(
    (a, b) =>
      a.siteName.localeCompare(b.siteName)
      || a.workDate.localeCompare(b.workDate)
      || a.checkInAt.localeCompare(b.checkInAt),
  );
  const data = sorted.map((row) => [
    row.workDate,
    row.employeeName,
    row.siteName,
    row.checkInAt,
    row.checkOutAt,
    row.workedMinutes === null
      ? null
      : Number((row.workedMinutes / 60).toFixed(2)),
    row.checkInBy,
    row.checkOutBy,
    row.overtimeCheck === null ? null : row.overtimeCheck ? "Yes" : "No",
    row.status,
  ]);
  return [
    ATTENDANCE_EXPORT_COLUMNS.map((column) => column.header),
    ...data,
  ]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n")
    .concat("\r\n");
}
