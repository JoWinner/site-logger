import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AttendanceSessionRow,
  Database,
  ProfileRow,
  SiteRow,
} from "@/lib/database.types";
import type { AttendanceExportRow } from "@/lib/exports/attendance-workbook";

export interface AttendanceExportInput {
  from: string;
  to: string;
  siteIds: string[];
}

export interface AuthorizedAttendanceExport extends AttendanceExportInput {
  recorderId: string | null;
}

function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf())
    && date.toISOString().slice(0, 10) === value;
}

export function authorizeAttendanceExport(
  profile: ProfileRow,
  input: AttendanceExportInput,
): AuthorizedAttendanceExport {
  if (!isDate(input.from) || !isDate(input.to) || input.from > input.to) {
    throw new Error("Choose a valid From and To date range.");
  }

  if (profile.role === "timekeeper") {
    if (!profile.assigned_site_id) {
      throw new Error("A site assignment is required before exporting.");
    }
    return {
      from: input.from,
      to: input.to,
      siteIds: [profile.assigned_site_id],
      recorderId: profile.id,
    };
  }

  const siteIds = [...new Set(input.siteIds.filter(Boolean))];
  if (!siteIds.length) {
    throw new Error("Select at least one site to export.");
  }
  return { from: input.from, to: input.to, siteIds, recorderId: null };
}

function timekeeperLabel(
  names: Map<string, string>,
  id: string | null,
): string | null {
  if (!id) return null;
  const name = names.get(id);
  return `${name ? `${name} · ` : ""}${id.slice(0, 8)}…`;
}

export async function loadAuthorizedAttendanceExport(
  supabase: SupabaseClient<Database>,
  profile: ProfileRow,
  input: AttendanceExportInput,
): Promise<{ rows: AttendanceExportRow[]; sites: SiteRow[] }> {
  const scope = authorizeAttendanceExport(profile, input);
  const { data: siteData, error: siteError } = await supabase
    .from("sites")
    .select("*")
    .in("id", scope.siteIds);
  if (siteError) throw new Error("Export sites could not be verified.");
  const sites = (siteData ?? []) as unknown as SiteRow[];
  if (sites.length !== scope.siteIds.length) {
    throw new Error("One or more selected sites are unavailable.");
  }

  let query = supabase
    .from("attendance_sessions")
    .select("*")
    .in("site_id", scope.siteIds)
    .gte("work_date", scope.from)
    .lte("work_date", scope.to);
  if (scope.recorderId) {
    query = query.or(
      `check_in_by.eq.${scope.recorderId},check_out_by.eq.${scope.recorderId}`,
    );
  }
  const { data: sessionData, error } = await query
    .order("site_name_snapshot")
    .order("work_date")
    .order("check_in_at")
    .limit(10_001);
  if (error) throw new Error("Attendance export could not be prepared.");
  const sessions = (sessionData ?? []) as unknown as AttendanceSessionRow[];
  if (sessions.length > 10_000) {
    throw new Error("The export exceeds 10,000 rows. Choose a smaller range.");
  }

  const profileIds = [
    ...new Set(
      sessions.flatMap((session) =>
        [session.check_in_by, session.check_out_by].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    ),
  ];
  let profiles: ProfileRow[] = [];
  if (profileIds.length) {
    const result = await supabase.from("profiles").select("*").in("id", profileIds);
    if (!result.error) profiles = (result.data ?? []) as unknown as ProfileRow[];
  }
  const names = new Map(profiles.map((item) => [item.id, item.display_name]));

  const rows = sessions.map((session) => ({
    workDate: session.work_date,
    employeeName: session.employee_name_snapshot,
    siteId: session.site_id,
    siteName: session.site_name_snapshot,
    checkInAt: session.check_in_at,
    checkOutAt: session.check_out_at,
    workedMinutes: session.worked_minutes,
    checkInBy: timekeeperLabel(names, session.check_in_by) ?? "Unknown user",
    checkOutBy: timekeeperLabel(names, session.check_out_by),
    overtimeCheck: session.overtime_check,
    status: session.status,
  }));
  return { rows, sites };
}
