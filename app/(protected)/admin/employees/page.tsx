import Link from "next/link";

import { EmployeeForm } from "@/app/(protected)/admin/employees/employee-form";
import { requireProfile } from "@/lib/auth/session";
import type { EmployeeRow } from "@/lib/database.types";

export default async function EmployeesPage() {
  const { supabase } = await requireProfile(["admin", "super_admin"]);
  const { data } = await supabase
    .from("employees")
    .select("*")
    .order("full_name");
  const employees = (data ?? []) as unknown as EmployeeRow[];

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">People · Master data</p>
          <h1>Employees</h1>
          <p>
            Employee ID/PIN is optional. Every employee is identified internally
            by their QR badge and system UUID.
          </p>
        </div>
      </header>
      <div className="split-layout">
        <article className="panel">
          <h2>Add employee</h2>
          <EmployeeForm />
        </article>
        <article className="panel panel--wide">
          <div className="panel__header">
            <h2>Employee ledger</h2>
            <span>{employees.length} records</span>
          </div>
          <div className="record-list">
            {employees.map((employee) => (
              <details className="record-row" key={employee.id}>
                <summary>
                  <span className={`status-pip ${employee.is_active ? "is-active" : ""}`} />
                  <strong>{employee.full_name}</strong>
                  <span>{employee.employee_id_pin ?? "No ID / PIN"}</span>
                  <span>{employee.trade_role ?? "Role not set"}</span>
                </summary>
                <div className="record-row__body">
                  <EmployeeForm
                    compact
                    employee={{
                      id: employee.id,
                      fullName: employee.full_name,
                      employeeIdPin: employee.employee_id_pin,
                      tradeRole: employee.trade_role,
                      crew: employee.crew,
                      isActive: employee.is_active,
                    }}
                  />
                  <Link className="button button--signal" href={`/admin/employees/${employee.id}/badge`}>
                    Issue / print QR badge
                  </Link>
                </div>
              </details>
            ))}
            {employees.length === 0 ? (
              <p className="empty-copy">No employees yet. Add the first record.</p>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
