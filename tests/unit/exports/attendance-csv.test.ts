import { describe, expect, it } from "vitest";

import { buildAttendanceCsv } from "@/lib/exports/attendance-csv";
import type { AttendanceExportRow } from "@/lib/exports/attendance-workbook";

const rows: AttendanceExportRow[] = [
  {
    workDate: "2026-07-02",
    employeeName: "Worker B",
    siteId: "b",
    siteName: "Beta",
    checkInAt: "2026-07-02T08:00:00.000Z",
    checkOutAt: null,
    workedMinutes: null,
    checkInBy: "Frank · 77cefe0a",
    checkOutBy: null,
    overtimeCheck: false,
    status: "open",
  },
  {
    workDate: "2026-07-01",
    employeeName: "Worker A",
    siteId: "a",
    siteName: "Atlas",
    checkInAt: "2026-07-01T07:00:00.000Z",
    checkOutAt: "2026-07-01T15:00:00.000Z",
    workedMinutes: 480,
    checkInBy: "Frank · 77cefe0a",
    checkOutBy: "Frank · 77cefe0a",
    overtimeCheck: true,
    status: "complete",
  },
];

describe("attendance CSV", () => {
  it("uses approved columns and sorts by site then date", () => {
    const csv = buildAttendanceCsv(rows);
    const lines = csv.trim().split("\r\n");
    expect(lines[0]).toBe(
      "Date,Employee Name,Job Site,Check In,Check Out,Hours,Check In By,Check Out By,Overtime Check,Attendance Status",
    );
    expect(lines[1]).toContain("Worker A");
    expect(lines[2]).toContain("Worker B");
  });
});
