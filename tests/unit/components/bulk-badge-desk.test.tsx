import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BulkBadgeDesk } from "@/components/attendance/bulk-badge-desk";
import type { EmployeeRow } from "@/lib/database.types";

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,qr"),
  },
}));

const employees: EmployeeRow[] = [
  {
    id: "employee-1",
    employee_id_pin: "E001",
    full_name: "Marcus Hill",
    trade_role: "Carpenter",
    current_site_id: null,
    is_active: true,
    created_by: null,
    updated_by: null,
    created_at: "2026-07-01T10:00:00.000Z",
    updated_at: "2026-07-03T10:00:00.000Z",
  },
  {
    id: "employee-2",
    employee_id_pin: null,
    full_name: "Ama Mensah",
    trade_role: "Foreman",
    current_site_id: null,
    is_active: true,
    created_by: null,
    updated_by: null,
    created_at: "2026-07-01T10:00:00.000Z",
    updated_at: "2026-07-03T10:00:00.000Z",
  },
];

describe("BulkBadgeDesk", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("filters and selects all visible employees", () => {
    render(<BulkBadgeDesk employees={employees} />);

    fireEvent.change(screen.getByLabelText("Search employees"), {
      target: { value: "Foreman" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Select filtered" }));

    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Issue 1 badge" })).toBeEnabled();
  });

  it("confirms issuing and renders a named badge preview", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            badges: [
              {
                employeeId: "employee-1",
                employeeName: "Marcus Hill",
                employeeIdPin: "E001",
                rawToken: "raw-token",
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );
    render(<BulkBadgeDesk employees={employees} />);

    fireEvent.click(screen.getByLabelText("Select Marcus Hill"));
    fireEvent.click(screen.getByRole("button", { name: "Issue 1 badge" }));

    await waitFor(() => {
      expect(screen.getByText("Badges ready to print")).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Marcus Hill" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Print badges" })).toBeEnabled();
  });
});
