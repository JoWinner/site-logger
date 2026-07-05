import { AttendanceLedger } from "@/components/attendance/attendance-ledger";
import { ExportControls } from "@/components/attendance/export-controls";
import { LedgerToolbar } from "@/components/data/ledger-toolbar";
import { loadAttendanceLedger } from "@/lib/attendance/ledger";
import { requireProfile } from "@/lib/auth/session";
import type { AttendanceStatus, SiteRow } from "@/lib/database.types";
import { parseLedgerQuery } from "@/lib/tables/query-state";

const STATUSES: AttendanceStatus[] = [
  "open",
  "complete",
  "incomplete",
  "corrected",
];

export default async function TimekeeperAttendancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profile, supabase } = await requireProfile(["timekeeper"]);
  const query = parseLedgerQuery(await searchParams, {
    sortKeys: ["date", "employee", "hours", "status"] as const,
    defaultSort: "date",
    defaultDirection: "desc",
  });
  const status = STATUSES.includes(query.status as AttendanceStatus)
    ? (query.status as AttendanceStatus)
    : null;
  const { data: siteData } = profile.assigned_site_id
    ? await supabase
        .from("sites")
        .select("*")
        .eq("id", profile.assigned_site_id)
        .maybeSingle()
    : { data: null };
  const site = (siteData ?? null) as unknown as SiteRow | null;
  const sessions = await loadAttendanceLedger(supabase, {
    limit: 500,
    siteIds: site ? [site.id] : [],
    recorderId: profile.id,
    from: query.from,
    to: query.to,
    search: query.search,
    status,
    overtime: query.overtime,
    sort: query.sort,
    direction: query.direction,
  });

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">My site · Attendance</p>
          <h1>{site ? `${site.name} attendance` : "Attendance unavailable"}</h1>
          <p>Only attendance you recorded at your assigned site is shown.</p>
        </div>
      </header>
      <article className="panel">
        <ExportControls assignedSite={site} sites={site ? [site] : []} />
      </article>
      <article className="panel">
        <LedgerToolbar
          direction={query.direction}
          from={query.from}
          includeDates
          overtime={query.overtime}
          search={query.search}
          sort={query.sort}
          sortOptions={[
            { value: "date", label: "Date and time" },
            { value: "employee", label: "Employee name" },
            { value: "hours", label: "Hours" },
            { value: "status", label: "Status" },
          ]}
          status={status}
          statusOptions={STATUSES.map((value) => ({
            value,
            label: value[0].toUpperCase() + value.slice(1),
          }))}
          to={query.to}
        />
        <AttendanceLedger role={profile.role} rows={sessions} />
      </article>
    </section>
  );
}
