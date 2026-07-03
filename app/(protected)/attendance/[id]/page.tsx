import { notFound } from "next/navigation";

import { CorrectionForm } from "@/components/attendance/correction-form";
import { ManualFieldsForm } from "@/components/attendance/manual-fields-form";
import { requireProfile } from "@/lib/auth/session";
import type { AttendanceSessionRow } from "@/lib/database.types";

function evidenceLine(latitude: number | null, longitude: number | null, accuracy: number | null) {
  if (latitude === null || longitude === null || accuracy === null) return "Not captured";
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)} · ±${Math.round(accuracy)} m`;
}

export default async function AttendanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile, supabase } = await requireProfile();
  const { data } = await supabase.from("attendance_sessions").select("*").eq("id", id).maybeSingle();
  const session = data as unknown as AttendanceSessionRow | null;
  if (!session) notFound();
  const isAdmin = profile.role === "admin" || profile.role === "super_admin";

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Attendance evidence</p>
          <h1>{session.employee_name_snapshot}</h1>
          <p>{session.site_name_snapshot} · {session.work_date}</p>
        </div>
        <span className={`ledger-status ledger-status--${session.status}`}>{session.status}</span>
      </header>
      <div className="evidence-grid">
        <article className="panel">
          <h2>Check in</h2>
          <dl className="evidence-list">
            <div><dt>Time</dt><dd>{new Date(session.check_in_at).toLocaleString()}</dd></div>
            <div><dt>GPS</dt><dd>{evidenceLine(session.check_in_latitude, session.check_in_longitude, session.check_in_accuracy_metres)}</dd></div>
            <div><dt>Timekeeper</dt><dd>{session.check_in_by.slice(0, 8)}…</dd></div>
          </dl>
        </article>
        <article className="panel">
          <h2>Check out</h2>
          <dl className="evidence-list">
            <div><dt>Time</dt><dd>{session.check_out_at ? new Date(session.check_out_at).toLocaleString() : "Open session"}</dd></div>
            <div><dt>GPS</dt><dd>{evidenceLine(session.check_out_latitude, session.check_out_longitude, session.check_out_accuracy_metres)}</dd></div>
            <div><dt>Hours</dt><dd>{session.worked_minutes === null ? "—" : (session.worked_minutes / 60).toFixed(2)}</dd></div>
          </dl>
        </article>
      </div>
      <div className="split-layout review-layout">
        <article className="panel"><h2>Manual review</h2><ManualFieldsForm session={session} /></article>
        {isAdmin ? <article className="panel"><h2>Correct display times</h2><p className="form-note">Original QR scan events remain unchanged.</p><CorrectionForm session={session} /></article> : null}
      </div>
    </section>
  );
}
