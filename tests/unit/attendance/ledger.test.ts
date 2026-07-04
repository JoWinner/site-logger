import { afterEach, describe, expect, it, vi } from "vitest";

import { loadAttendanceLedger } from "@/lib/attendance/ledger";
import type { AttendanceSessionRow, ProfileRow } from "@/lib/database.types";

const session: AttendanceSessionRow = {
  id: "session-1",
  employee_id: "employee-1",
  site_id: "site-1",
  work_date: "2026-07-04",
  employee_name_snapshot: "Marcus Hill",
  employee_id_pin_snapshot: "E001",
  site_name_snapshot: "Pokuase",
  site_code_snapshot: "POK",
  check_in_event_id: "event-1",
  check_out_event_id: null,
  check_in_at: "2026-07-04T07:00:00.000Z",
  check_out_at: null,
  check_in_latitude: 5.7036,
  check_in_longitude: -0.2845,
  check_in_accuracy_metres: 8,
  check_out_latitude: null,
  check_out_longitude: null,
  check_out_accuracy_metres: null,
  check_in_by: "timekeeper-1",
  check_out_by: null,
  check_in_location_label: "Pokuase Station, Greater Accra, Ghana",
  check_in_location_feature_id: "mapbox-id",
  check_in_location_resolution_status: "resolved",
  check_in_location_resolved_at: "2026-07-04T07:00:02.000Z",
  check_out_location_label: null,
  check_out_location_feature_id: null,
  check_out_location_resolution_status: null,
  check_out_location_resolved_at: null,
  worked_minutes: null,
  overtime_check: null,
  assignment_check: null,
  payroll_status: null,
  notes: null,
  status: "open",
  created_at: "2026-07-04T07:00:00.000Z",
  updated_at: "2026-07-04T07:00:00.000Z",
};

const profile: ProfileRow = {
  id: "timekeeper-1",
  username: "keeper",
  display_name: "Ama Mensah",
  role: "timekeeper",
  is_active: true,
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};

function queryResult<T>(data: T) {
  const query = {
    select: vi.fn(() => query),
    order: vi.fn(() => query),
    range: vi.fn().mockResolvedValue({ data, error: null }),
    in: vi.fn().mockResolvedValue({ data, error: null }),
  };
  return query;
}

describe("loadAttendanceLedger", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("places the timekeeper display name before the ID", async () => {
    vi.stubEnv("MAPBOX_GEOCODING_MODE", "permanent");
    const sessionQuery = queryResult([session]);
    const profileQuery = queryResult([profile]);
    const supabase = {
      from: vi
        .fn()
        .mockReturnValueOnce(sessionQuery)
        .mockReturnValueOnce(profileQuery),
    };

    const rows = await loadAttendanceLedger(supabase as never, { limit: 25 });

    expect(rows[0].checkInTimekeeperName).toBe("Ama Mensah");
    expect(rows[0].checkInLocationLabel).toBe(
      "Pokuase Station, Greater Accra, Ghana",
    );
  });
});
