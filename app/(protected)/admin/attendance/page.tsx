import Link from "next/link";

import { AttendanceLedger } from "@/components/attendance/attendance-ledger";
import { loadAttendanceLedger } from "@/lib/attendance/ledger";
import { requireProfile } from "@/lib/auth/session";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageValue } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageValue ?? "1", 10) || 1);
  const pageSize = 25;
  const { profile, supabase } = await requireProfile(["admin", "super_admin"]);
  const sessions = await loadAttendanceLedger(supabase, {
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Evidence · Review</p>
          <h1>Attendance ledger</h1>
          <p>
            Tap any record for GPS evidence, manual review, and corrections.
          </p>
        </div>
        <a className="button button--signal" href="/api/exports/attendance.xlsx">
          Export .xlsx
        </a>
      </header>
      <article className="panel">
        <AttendanceLedger
          mapAvailable={Boolean(process.env.MAPBOX_ACCESS_TOKEN)}
          role={profile.role}
          rows={sessions}
        />
        <nav className="pagination" aria-label="Attendance pages">
          {page > 1 ? (
            <Link className="button button--compact" href={`?page=${page - 1}`}>
              Previous
            </Link>
          ) : <span />}
          <span>Page {page}</span>
          {sessions.length === pageSize ? (
            <Link className="button button--compact" href={`?page=${page + 1}`}>
              Next
            </Link>
          ) : <span />}
        </nav>
      </article>
    </section>
  );
}
