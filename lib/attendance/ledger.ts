import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AttendanceSessionRow,
  AttendanceStatus,
  Database,
  ProfileRow,
} from "@/lib/database.types";

export interface AttendanceLedgerRow extends AttendanceSessionRow {
  checkInTimekeeperName: string | null;
  checkOutTimekeeperName: string | null;
}

export interface AttendanceLedgerFilters {
  limit: number;
  offset?: number;
  siteIds?: string[];
  recorderId?: string;
  from?: string | null;
  to?: string | null;
  search?: string;
  status?: AttendanceStatus | null;
  overtime?: "yes" | "no" | null;
  sort?: "date" | "employee" | "site" | "hours" | "status";
  direction?: "asc" | "desc";
}

export async function decorateAttendanceSessions(
  supabase: SupabaseClient<Database>,
  sessions: AttendanceSessionRow[],
): Promise<AttendanceLedgerRow[]> {
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
  if (profileIds.length > 0) {
    const result = await supabase
      .from("profiles")
      .select("*")
      .in("id", profileIds);
    if (!result.error) profiles = (result.data ?? []) as unknown as ProfileRow[];
  }
  const names = new Map(
    profiles.map((profile) => [profile.id, profile.display_name]),
  );

  return sessions.map((session) => ({
    ...session,
    checkInTimekeeperName: names.get(session.check_in_by) ?? null,
    checkOutTimekeeperName: session.check_out_by
      ? names.get(session.check_out_by) ?? null
      : null,
  }));
}

export async function loadAttendanceLedger(
  supabase: SupabaseClient<Database>,
  {
    limit,
    offset = 0,
    siteIds = [],
    recorderId,
    from,
    to,
    search = "",
    status,
    overtime,
    sort = "date",
    direction = "desc",
  }: AttendanceLedgerFilters,
): Promise<AttendanceLedgerRow[]> {
  let query = supabase.from("attendance_sessions").select("*");

  if (siteIds.length) query = query.in("site_id", siteIds);
  if (recorderId) {
    query = query.or(
      `check_in_by.eq.${recorderId},check_out_by.eq.${recorderId}`,
    );
  }
  if (from) query = query.gte("work_date", from);
  if (to) query = query.lte("work_date", to);
  if (search.trim()) {
    query = query.ilike("employee_name_snapshot", `%${search.trim()}%`);
  }
  if (status) query = query.eq("status", status);
  if (overtime) query = query.eq("overtime_check", overtime === "yes");

  const sortColumn = {
    date: "check_in_at",
    employee: "employee_name_snapshot",
    site: "site_name_snapshot",
    hours: "worked_minutes",
    status: "status",
  }[sort];

  const { data, error } = await query
    .order(sortColumn, { ascending: direction === "asc" })
    .range(offset, offset + limit - 1);
  if (error) throw new Error("Attendance records could not be loaded.");

  return decorateAttendanceSessions(
    supabase,
    (data ?? []) as unknown as AttendanceSessionRow[],
  );
}
