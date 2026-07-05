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
  assigned_site_id: "site-1",
  is_active: true,
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};

function queryResult<T>(data: T, terminalIn = false) {
  const query = {} as Record<string, ReturnType<typeof vi.fn>>;
  query.select = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.gte = vi.fn(() => query);
  query.lte = vi.fn(() => query);
  query.ilike = vi.fn(() => query);
  query.or = vi.fn(() => query);
  query.range = vi.fn().mockResolvedValue({ data, error: null });
  query.in = terminalIn
    ? vi.fn().mockResolvedValue({ data, error: null })
    : vi.fn(() => query);
  return query;
}

describe("loadAttendanceLedger", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("places the display name first and applies site and recorder scopes", async () => {
    const sessionQuery = queryResult([session]);
    const profileQuery = queryResult([profile], true);
    const supabase = {
      from: vi
        .fn()
        .mockReturnValueOnce(sessionQuery)
        .mockReturnValueOnce(profileQuery),
    };

    const rows = await loadAttendanceLedger(supabase as never, {
      limit: 25,
      siteIds: ["site-1"],
      recorderId: "timekeeper-1",
    });

    expect(rows[0].checkInTimekeeperName).toBe("Ama Mensah");
    expect(sessionQuery.in).toHaveBeenCalledWith("site_id", ["site-1"]);
    expect(sessionQuery.or).toHaveBeenCalledWith(
      "check_in_by.eq.timekeeper-1,check_out_by.eq.timekeeper-1",
    );
  });
});
