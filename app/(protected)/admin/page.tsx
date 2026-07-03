import Link from "next/link";

import { requireProfile } from "@/lib/auth/session";

export default async function AdminOverviewPage() {
  const { supabase } = await requireProfile(["admin", "super_admin"]);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Atlantic/Reykjavik",
  }).format(new Date());

  const [{ count: employees }, { count: sites }, { count: sessions }] =
    await Promise.all([
      supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("sites")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("attendance_sessions")
        .select("*", { count: "exact", head: true })
        .eq("work_date", today),
    ]);

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Operations · Today</p>
          <h1>Site control board</h1>
        </div>
        <Link className="button button--signal" href="/admin/attendance">
          Review attendance
        </Link>
      </header>
      <div className="metric-grid">
        <article className="metric-card">
          <span>Active employees</span>
          <strong>{employees ?? 0}</strong>
        </article>
        <article className="metric-card metric-card--dark">
          <span>Active sites</span>
          <strong>{sites ?? 0}</strong>
        </article>
        <article className="metric-card metric-card--signal">
          <span>Sessions today</span>
          <strong>{sessions ?? 0}</strong>
        </article>
      </div>
      <div className="action-grid">
        <Link href="/admin/employees">
          <span>People</span>
          <strong>Maintain employees and issue QR badges</strong>
        </Link>
        <Link href="/admin/sites">
          <span>Places</span>
          <strong>Maintain permanent construction sites</strong>
        </Link>
      </div>
    </section>
  );
}
