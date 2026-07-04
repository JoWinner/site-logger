import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AttendanceLedger } from "@/components/attendance/attendance-ledger";
import type { AttendanceLedgerRow } from "@/lib/attendance/ledger";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

const row: AttendanceLedgerRow = {
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
  check_in_location_label: "Pokuase Station, Greater Accra, Ghana",
  check_in_location_feature_id: "mapbox-id",
  check_in_location_resolution_status: "resolved",
  check_in_location_resolved_at: "2026-07-04T07:00:02.000Z",
  check_out_location_label: null,
  check_out_location_feature_id: null,
  check_out_location_resolution_status: null,
  check_out_location_resolved_at: null,
  check_in_by: "timekeeper-1",
  check_out_by: null,
  checkInLocationLabel: "Pokuase Station, Greater Accra, Ghana",
  checkOutLocationLabel: null,
  checkInTimekeeperName: "Ama Mensah",
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

describe("AttendanceLedger", () => {
  it("shows GPS location and Timekeeper identity in the ledger", () => {
    render(<AttendanceLedger role="admin" rows={[row]} />);

    expect(
      screen.getByRole("table", { name: "Attendance ledger" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Pokuase Station, Greater Accra, Ghana"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ama Mensah · timekeep/i)).toBeInTheDocument();
  });

  it("opens a quick preview with every Admin action and full-page expansion", () => {
    render(<AttendanceLedger role="admin" rows={[row]} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open attendance preview for Marcus Hill",
      }),
    );

    expect(
      screen.getByRole("dialog", { name: "Marcus Hill attendance" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Manual review")).toBeInTheDocument();
    expect(screen.getByText("Correct display times")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open full attendance page" }),
    ).toHaveAttribute("href", "/attendance/session-1");
  });

  it("does not expose correction controls to Timekeepers", () => {
    render(<AttendanceLedger role="timekeeper" rows={[row]} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open attendance preview for Marcus Hill",
      }),
    );

    expect(screen.getByText("Manual review")).toBeInTheDocument();
    expect(screen.queryByText("Correct display times")).not.toBeInTheDocument();
  });
});
