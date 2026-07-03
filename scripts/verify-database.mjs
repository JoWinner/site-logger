import { createClient } from "@supabase/supabase-js";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const supabase = createClient(
  required("NEXT_PUBLIC_SUPABASE_URL"),
  required("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const requiredTables = [
  "profiles",
  "employees",
  "sites",
  "employee_qr_tokens",
  "attendance_events",
  "attendance_sessions",
  "attendance_corrections",
  "audit_logs",
];

for (const table of requiredTables) {
  const { error } = await supabase.from(table).select("*", {
    count: "exact",
    head: true,
  });
  if (error) throw new Error(`${table}: ${error.message}`);
}

const { count: employeeCount } = await supabase
  .from("employees")
  .select("*", { count: "exact", head: true });
const { count: siteCount } = await supabase
  .from("sites")
  .select("*", { count: "exact", head: true });

console.log(
  JSON.stringify(
    {
      status: "ok",
      tables: requiredTables.length,
      employees: employeeCount ?? 0,
      sites: siteCount ?? 0,
    },
    null,
    2,
  ),
);
