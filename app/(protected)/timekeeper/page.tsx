import { ScanConsole } from "@/app/(protected)/timekeeper/scan-console";
import { RecentScansTable } from "@/components/attendance/recent-scans-table";
import { loadAttendanceLedger } from "@/lib/attendance/ledger";
import { requireProfile } from "@/lib/auth/session";
import type { SiteRow } from "@/lib/database.types";

export default async function TimekeeperPage() {
  const { profile, supabase } = await requireProfile();
  const [{ data: siteData }, sessions] = await Promise.all([
    profile.assigned_site_id
      ? supabase
          .from("sites")
          .select("*")
          .eq("id", profile.assigned_site_id)
          .eq("is_active", true)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    loadAttendanceLedger(supabase, {
      limit: 12,
      siteIds: profile.assigned_site_id ? [profile.assigned_site_id] : [],
      recorderId: profile.id,
    }),
  ]);
  const site = (siteData ?? null) as unknown as SiteRow | null;

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Field capture</p>
          <h1>Scan attendance</h1>
          <p>Fresh GPS coordinates are captured for every scan at your assigned site.</p>
        </div>
      </header>
      <ScanConsole site={site} />
      <article className="panel recent-panel">
        <div className="panel__header">
          <h2>Recent scans</h2>
          <span>Your visible records</span>
        </div>
        <RecentScansTable
          role={profile.role}
          rows={sessions}
        />
      </article>
    </section>
  );
}
