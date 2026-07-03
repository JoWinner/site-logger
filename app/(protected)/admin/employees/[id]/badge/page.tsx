import { notFound } from "next/navigation";

import { EmployeeBadge } from "@/components/attendance/employee-badge";
import { requireProfile } from "@/lib/auth/session";
import type { EmployeeRow } from "@/lib/database.types";

export default async function BadgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireProfile(["admin", "super_admin"]);
  const { data } = await supabase.from("employees").select("*").eq("id", id).maybeSingle();
  const employee = data as unknown as EmployeeRow | null;
  if (!employee) notFound();

  return (
    <section>
      <header className="page-header no-print">
        <div>
          <p className="eyebrow">Badge desk</p>
          <h1>Issue employee QR</h1>
        </div>
      </header>
      <EmployeeBadge
        employeeId={employee.id}
        employeeIdPin={employee.employee_id_pin}
        employeeName={employee.full_name}
      />
    </section>
  );
}
