import { NextResponse } from "next/server";

import { requireProfile } from "@/lib/auth/session";
import type {
  AttendanceSessionRow,
  ProfileRow,
} from "@/lib/database.types";
import {
  buildAttendanceWorkbook,
  type AttendanceExportRow,
} from "@/lib/exports/attendance-workbook";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireProfile(["admin", "super_admin"]);
  const admin = createAdminSupabaseClient();
  const [{ data: sessionData, error }, { data: profileData }] =
    await Promise.all([
      admin
        .from("attendance_sessions")
        .select("*")
        .order("check_in_at", { ascending: false })
        .limit(10_000),
      admin.from("profiles").select("*"),
    ]);

  if (error) {
    return NextResponse.json(
      { error: "Attendance export could not be prepared." },
      { status: 500 },
    );
  }

  const profiles = (profileData ?? []) as ProfileRow[];
  const names = new Map(profiles.map((profile) => [profile.id, profile.display_name]));
  const rows: AttendanceExportRow[] = (
    (sessionData ?? []) as AttendanceSessionRow[]
  ).map((session) => ({
    workDate: session.work_date,
    employeeName: session.employee_name_snapshot,
    employeeIdPin: session.employee_id_pin_snapshot,
    siteName: session.site_name_snapshot,
    checkInAt: session.check_in_at,
    checkOutAt: session.check_out_at,
    workedMinutes: session.worked_minutes,
    checkInLatitude: session.check_in_latitude,
    checkInLongitude: session.check_in_longitude,
    checkInAccuracyMetres: session.check_in_accuracy_metres,
    checkOutLatitude: session.check_out_latitude,
    checkOutLongitude: session.check_out_longitude,
    checkOutAccuracyMetres: session.check_out_accuracy_metres,
    checkInBy: names.get(session.check_in_by) ?? "Unknown user",
    checkOutBy: session.check_out_by
      ? names.get(session.check_out_by) ?? "Unknown user"
      : null,
    overtimeCheck: session.overtime_check,
    assignmentCheck: session.assignment_check,
    payrollStatus: session.payroll_status,
    notes: session.notes,
    status: session.status,
  }));
  const workbook = await buildAttendanceWorkbook(rows);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(workbook), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=\"site-logger-attendance-${stamp}.xlsx\"`,
      "Cache-Control": "no-store",
    },
  });
}
