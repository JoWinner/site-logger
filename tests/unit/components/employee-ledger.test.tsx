import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EmployeeLedger } from "@/components/admin/employee-ledger";
import type { EmployeeRow, SiteRow } from "@/lib/database.types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

const employee: EmployeeRow = {
  id: "employee-1",
  employee_id_pin: "E001",
  full_name: "Marcus Hill",
  trade_role: "Carpenter",
  current_site_id: "site-1",
  is_active: true,
  created_by: null,
  updated_by: null,
  created_at: "2026-07-01T10:00:00.000Z",
  updated_at: "2026-07-03T10:00:00.000Z",
};

const site: SiteRow = {
  id: "site-1",
  site_code: "ATLAS",
  name: "Atlas",
  is_active: true,
  created_by: null,
  updated_by: null,
  created_at: "2026-07-01T10:00:00.000Z",
  updated_at: "2026-07-03T10:00:00.000Z",
};

describe("EmployeeLedger", () => {
  it("renders a full employee table with row actions", () => {
    render(<EmployeeLedger employees={[employee]} sites={[site]} />);

    expect(
      screen.getByRole("table", { name: "Employee ledger" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Marcus Hill")).toBeInTheDocument();
    expect(screen.getByText("E001")).toBeInTheDocument();
    expect(screen.getByText("Atlas")).toBeInTheDocument();
    expect(screen.queryByText("Crew")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit Marcus Hill" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "QR badge for Marcus Hill" }),
    ).toHaveAttribute("href", "/admin/employees/employee-1/badge");
  });

  it("opens the employee editor from the row", () => {
    render(<EmployeeLedger employees={[employee]} sites={[site]} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Marcus Hill" }));

    expect(
      screen.getByRole("dialog", { name: "Edit Marcus Hill" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Employee name *")).toHaveValue("Marcus Hill");
    expect(screen.getByLabelText("Current site")).toHaveValue("site-1");
    expect(screen.queryByLabelText("Crew")).not.toBeInTheDocument();
  });
});
