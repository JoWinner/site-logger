import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RecentScansTable } from "@/components/attendance/recent-scans-table";
import type { AttendanceLedgerRow } from "@/lib/attendance/ledger";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const row: AttendanceLedgerRow = {
  id: "session-1",
  employee_id: "employee-1",
  site_id: "site-1",
  work_date: "2026-07-04",
  employee_name_snapshot: "Marcus Hill",
  employee_id_pin_snapshot: "E001",
  site_name_snapshot: "Atlas",
  site_code_snapshot: "ATLAS",
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
  checkInTimekeeperName: "Frank",
  checkOutTimekeeperName: null,
  worked_minutes: null,
  overtime_check: null,
  assignment_check: null,
  payroll_status: null,
  notes: null,
  status: "open",
  created_at: "2026-07-04T07:00:00.000Z",
  updated_at: "2026-07-04T07:00:00.000Z",
};

describe("RecentScansTable", () => {
  it("renders the approved compact table contract", () => {
    render(<RecentScansTable role="timekeeper" rows={[row]} />);

    const table = screen.getByRole("table", { name: "Recent scans" });
    expect(table).toHaveClass("recent-scans-table");
    expect(table).not.toHaveClass("responsive-table");
    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual(["Employee", "Time", "Status", "View"]);
    expect(screen.getByText("Marcus Hill")).toBeInTheDocument();
    expect(screen.getByText("2026-07-04")).toBeInTheDocument();
  });

  it("opens the existing attendance preview from View", () => {
    render(<RecentScansTable role="timekeeper" rows={[row]} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Open recent scan for Marcus Hill" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Marcus Hill attendance" }),
    ).toBeInTheDocument();
  });
});
