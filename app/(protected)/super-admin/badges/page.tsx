import { BulkBadgeDesk } from "@/components/attendance/bulk-badge-desk";
import { requireProfile } from "@/lib/auth/session";
import type { EmployeeRow, SiteRow } from "@/lib/database.types";

export default async function BulkBadgesPage() {
  const { supabase } = await requireProfile(["super_admin"]);
  const [{ data }, { data: siteData }] = await Promise.all([
    supabase
      .from("employees")
      .select("*")
      .eq("is_active", true)
      .order("full_name"),
    supabase.from("sites").select("*").order("name"),
  ]);
  const employees = (data ?? []) as unknown as EmployeeRow[];
  const sites = (siteData ?? []) as unknown as SiteRow[];

  return (
    <section>
      <header className="page-header no-print">
        <div>
          <p className="eyebrow">Access · Super Admin</p>
          <h1>Bulk QR badges</h1>
          <p>
            Select up to 100 employees, issue their badges once, then print the
            named badge sheet before leaving.
          </p>
        </div>
      </header>
      <article className="panel bulk-badge-panel">
        <BulkBadgeDesk employees={employees} sites={sites} />
      </article>
    </section>
  );
}
