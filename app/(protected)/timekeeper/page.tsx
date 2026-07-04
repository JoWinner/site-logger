import { ScanConsole } from "@/app/(protected)/timekeeper/scan-console";
import { AttendanceLedger } from "@/components/attendance/attendance-ledger";
import { loadAttendanceLedger } from "@/lib/attendance/ledger";
import { requireProfile } from "@/lib/auth/session";
import type { SiteRow } from "@/lib/database.types";

export default async function TimekeeperPage() {
  const { profile, supabase } = await requireProfile();
  const [{ data: siteData }, sessions] = await Promise.all([
    supabase.from("sites").select("*").eq("is_active", true).order("name"),
    loadAttendanceLedger(supabase, { limit: 12 }),
  ]);
  const sites = (siteData ?? []) as unknown as SiteRow[];

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Field capture</p>
          <h1>Scan attendance</h1>
          <p>GPS coordinates and a readable location are captured for every scan.</p>
        </div>
      </header>
      <ScanConsole sites={sites} />
      <article className="panel recent-panel">
        <div className="panel__header">
          <h2>Recent scans</h2>
          <span>Your visible records</span>
        </div>
        <AttendanceLedger
          mapAvailable={Boolean(process.env.MAPBOX_ACCESS_TOKEN)}
          role={profile.role}
          rows={sessions}
        />
      </article>
    </section>
  );
}
