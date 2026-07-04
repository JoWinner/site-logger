"use client";

import Link from "next/link";
import { useState } from "react";

import { EmployeeForm } from "@/app/(protected)/admin/employees/employee-form";
import { RecordDialog } from "@/components/data/record-dialog";
import {
  ResponsiveTable,
  type ResponsiveColumn,
} from "@/components/data/responsive-table";
import type { EmployeeRow } from "@/lib/database.types";

const columns: ResponsiveColumn<EmployeeRow>[] = [
  {
    key: "status",
    label: "Status",
    render: (employee) => (
      <span className="record-status">
        <span
          aria-hidden="true"
          className={`status-pip ${employee.is_active ? "is-active" : ""}`}
        />
        {employee.is_active ? "Active" : "Inactive"}
      </span>
    ),
  },
  {
    key: "name",
    label: "Employee",
    render: (employee) => <strong>{employee.full_name}</strong>,
  },
  {
    key: "id",
    label: "ID / PIN",
    render: (employee) => employee.employee_id_pin ?? "Not assigned",
  },
  {
    key: "trade",
    label: "Trade / role",
    render: (employee) => employee.trade_role ?? "Not set",
  },
  {
    key: "crew",
    label: "Crew",
    render: (employee) => employee.crew ?? "Not set",
  },
  {
    key: "updated",
    label: "Updated",
    render: (employee) => (
      <time dateTime={employee.updated_at}>{employee.updated_at.slice(0, 10)}</time>
    ),
  },
];

export function EmployeeLedger({ employees }: { employees: EmployeeRow[] }) {
  const [editing, setEditing] = useState<EmployeeRow | null>(null);

  return (
    <>
      <ResponsiveTable
        actions={(employee) => (
          <div className="row-actions">
            <button
              aria-label={`Edit ${employee.full_name}`}
              className="button button--compact"
              onClick={() => setEditing(employee)}
              type="button"
            >
              Edit
            </button>
            <Link
              aria-label={`QR badge for ${employee.full_name}`}
              className="button button--compact button--signal"
              href={`/admin/employees/${employee.id}/badge`}
            >
              QR badge
            </Link>
          </div>
        )}
        caption="Employee ledger"
        columns={columns}
        emptyMessage="No employees yet. Add or import the first records."
        rows={employees}
      />
      <RecordDialog
        onClose={() => setEditing(null)}
        open={editing !== null}
        title={editing ? `Edit ${editing.full_name}` : "Edit employee"}
      >
        {editing ? (
          <EmployeeForm
            compact
            employee={{
              id: editing.id,
              fullName: editing.full_name,
              employeeIdPin: editing.employee_id_pin,
              tradeRole: editing.trade_role,
              crew: editing.crew,
              isActive: editing.is_active,
            }}
          />
        ) : null}
      </RecordDialog>
    </>
  );
}
