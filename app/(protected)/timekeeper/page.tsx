import Link from "next/link";

import { ScanConsole } from "@/app/(protected)/timekeeper/scan-console";
import { requireProfile } from "@/lib/auth/session";
import type { AttendanceSessionRow, SiteRow } from "@/lib/database.types";

export default async function TimekeeperPage() {
  const { supabase } = await requireProfile();
  const [{ data: siteData }, { data: sessionData }] = await Promise.all([
    supabase.from("sites").select("*").eq("is_active", true).order("name"),
    supabase
      .from("attendance_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);
  const sites = (siteData ?? []) as unknown as SiteRow[];
  const sessions = (sessionData ?? []) as unknown as AttendanceSessionRow[];

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Field capture</p>
          <h1>Scan attendance</h1>
          <p>GPS is captured for every accepted Check In and Check Out.</p>
        </div>
      </header>
      <ScanConsole sites={sites} />
      <article className="panel recent-panel">
        <div className="panel__header">
          <h2>Recent scans</h2>
          <span>Your visible records</span>
        </div>
        <div className="attendance-table">
          <div className="attendance-table__head">
            <span>Employee</span><span>Site</span><span>Check in</span><span>Check out</span><span>Status</span>
          </div>
          {sessions.map((session) => (
            <Link className="attendance-table__row" href={`/attendance/${session.id}`} key={session.id}>
              <strong>{session.employee_name_snapshot}</strong>
              <span>{session.site_name_snapshot}</span>
              <time>{new Date(session.check_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
              <time>{session.check_out_at ? new Date(session.check_out_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</time>
              <span className={`ledger-status ledger-status--${session.status}`}>{session.status}</span>
            </Link>
          ))}
          {sessions.length === 0 ? <p className="empty-copy">No scans recorded yet.</p> : null}
        </div>
      </article>
    </section>
  );
}
