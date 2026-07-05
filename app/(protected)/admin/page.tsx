import Link from "next/link";

import {
  SiteOverviewGrid,
  type SiteOverviewGroup,
} from "@/components/admin/site-overview-grid";
import { requireProfile } from "@/lib/auth/session";
import type {
  AttendanceSessionRow,
  EmployeeRow,
  ProfileRow,
  SiteRow,
} from "@/lib/database.types";

export default async function AdminOverviewPage() {
  const { supabase } = await requireProfile(["admin", "super_admin"]);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Atlantic/Reykjavik",
  }).format(new Date());

  const [
    { data: employeeData },
    { data: siteData },
    { data: sessionData },
    { data: profileData },
  ] = await Promise.all([
    supabase.from("employees").select("*").eq("is_active", true),
    supabase.from("sites").select("*").eq("is_active", true).order("name"),
    supabase.from("attendance_sessions").select("*").eq("work_date", today),
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "timekeeper")
      .eq("is_active", true),
  ]);
  const employees = (employeeData ?? []) as unknown as EmployeeRow[];
  const sites = (siteData ?? []) as unknown as SiteRow[];
  const sessions = (sessionData ?? []) as unknown as AttendanceSessionRow[];
  const timekeepers = (profileData ?? []) as unknown as ProfileRow[];
  const groups: SiteOverviewGroup[] = sites.map((site) => ({
    key: site.id,
    name: site.name,
    siteCode: site.site_code,
    activeEmployees: employees.filter(
      (employee) => employee.current_site_id === site.id,
    ).length,
    sessionsToday: sessions.filter((session) => session.site_id === site.id).length,
    timekeepers: timekeepers
      .filter((profile) => profile.assigned_site_id === site.id)
      .map((profile) => profile.display_name)
      .sort(),
  }));
  const unassignedCount = employees.filter(
    (employee) => employee.current_site_id === null,
  ).length;
  if (unassignedCount) {
    groups.push({
      key: "unassigned",
      name: "Unassigned",
      siteCode: null,
      activeEmployees: unassignedCount,
      sessionsToday: 0,
      timekeepers: [],
    });
  }

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
          <strong>{employees.length}</strong>
        </article>
        <article className="metric-card metric-card--dark">
          <span>Active sites</span>
          <strong>{sites.length}</strong>
        </article>
        <article className="metric-card metric-card--signal">
          <span>Sessions today</span>
          <strong>{sessions.length}</strong>
        </article>
      </div>
      <SiteOverviewGrid groups={groups} />
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
