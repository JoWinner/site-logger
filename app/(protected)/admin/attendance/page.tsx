import Link from "next/link";

import { requireProfile } from "@/lib/auth/session";
import type { AttendanceSessionRow } from "@/lib/database.types";

export default async function AttendancePage() {
  const { supabase } = await requireProfile(["admin", "super_admin"]);
  const { data } = await supabase.from("attendance_sessions").select("*").order("check_in_at", { ascending: false }).limit(250);
  const sessions = (data ?? []) as unknown as AttendanceSessionRow[];

  return (
    <section>
      <header className="page-header">
        <div><p className="eyebrow">Evidence · Review</p><h1>Attendance ledger</h1><p>Each row traces back to immutable Check In and Check Out scan evidence.</p></div>
        <a className="button button--signal" href="/api/exports/attendance.xlsx">Export .xlsx</a>
      </header>
      <article className="panel">
        <div className="attendance-table">
          <div className="attendance-table__head">
            <span>Date</span><span>Employee</span><span>Site</span><span>Check in</span><span>Check out</span><span>Hours</span><span>Status</span>
          </div>
          {sessions.map((session) => (
            <Link className="attendance-table__row attendance-table__row--admin" href={`/attendance/${session.id}`} key={session.id}>
              <time>{session.work_date}</time><strong>{session.employee_name_snapshot}</strong><span>{session.site_name_snapshot}</span><time>{new Date(session.check_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time><time>{session.check_out_at ? new Date(session.check_out_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</time><span>{session.worked_minutes === null ? "—" : (session.worked_minutes / 60).toFixed(2)}</span><span className={`ledger-status ledger-status--${session.status}`}>{session.status}</span>
            </Link>
          ))}
          {sessions.length === 0 ? <p className="empty-copy">No attendance sessions yet.</p> : null}
        </div>
      </article>
    </section>
  );
}
