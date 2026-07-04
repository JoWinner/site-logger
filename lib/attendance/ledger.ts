import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AttendanceSessionRow,
  Database,
  ProfileRow,
} from "@/lib/database.types";
import { reverseGeocode } from "@/lib/location/mapbox";

export interface AttendanceLedgerRow extends AttendanceSessionRow {
  checkInLocationLabel: string | null;
  checkOutLocationLabel: string | null;
  checkInTimekeeperName: string | null;
  checkOutTimekeeperName: string | null;
}

async function temporaryLabel(
  latitude: number | null,
  longitude: number | null,
): Promise<string | null> {
  if (
    process.env.MAPBOX_GEOCODING_MODE !== "temporary" ||
    latitude === null ||
    longitude === null
  ) {
    return null;
  }
  return (await reverseGeocode(latitude, longitude))?.label ?? null;
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

  return Promise.all(
    sessions.map(async (session) => ({
      ...session,
      checkInLocationLabel:
        session.check_in_location_label ??
        (await temporaryLabel(
          session.check_in_latitude,
          session.check_in_longitude,
        )),
      checkOutLocationLabel:
        session.check_out_location_label ??
        (await temporaryLabel(
          session.check_out_latitude,
          session.check_out_longitude,
        )),
      checkInTimekeeperName: names.get(session.check_in_by) ?? null,
      checkOutTimekeeperName: session.check_out_by
        ? names.get(session.check_out_by) ?? null
        : null,
    })),
  );
}

export async function loadAttendanceLedger(
  supabase: SupabaseClient<Database>,
  { limit, offset = 0 }: { limit: number; offset?: number },
): Promise<AttendanceLedgerRow[]> {
  const { data, error } = await supabase
    .from("attendance_sessions")
    .select("*")
    .order("check_in_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error("Attendance records could not be loaded.");

  const sessions = (data ?? []) as unknown as AttendanceSessionRow[];
  return decorateAttendanceSessions(supabase, sessions);
}
