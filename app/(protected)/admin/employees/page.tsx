import { EmployeeForm } from "@/app/(protected)/admin/employees/employee-form";
import { EmployeeLedger } from "@/components/admin/employee-ledger";
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
      <div className="master-data-stack">
        <article className="panel master-data-create">
          <h2>Add employee</h2>
          <EmployeeForm />
        </article>
        <article className="panel">
          <div className="panel__header">
            <h2>Employee ledger</h2>
            <span>{employees.length} records</span>
          </div>
          <EmployeeLedger employees={employees} />
        </article>
      </div>
    </section>
  );
}
