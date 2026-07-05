import { AttendanceLedger } from "@/components/attendance/attendance-ledger";
import { ExportControls } from "@/components/attendance/export-controls";
import { LedgerToolbar } from "@/components/data/ledger-toolbar";
import { SiteLedgerGroups } from "@/components/data/site-ledger-groups";
import { loadAttendanceLedger } from "@/lib/attendance/ledger";
import { requireProfile } from "@/lib/auth/session";
import type { AttendanceStatus, SiteRow } from "@/lib/database.types";
import { groupBySite, parseLedgerQuery } from "@/lib/tables/query-state";

const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "open",
  "complete",
  "incomplete",
  "corrected",
];

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profile, supabase } = await requireProfile(["admin", "super_admin"]);
  const query = parseLedgerQuery(await searchParams, {
    sortKeys: ["date", "employee", "site", "hours", "status"] as const,
    defaultSort: "date",
    defaultDirection: "desc",
  });
  const { data: siteData } = await supabase.from("sites").select("*").order("name");
  const sites = (siteData ?? []) as unknown as SiteRow[];
  const validSiteIds = new Set(sites.map((site) => site.id));
  const siteIds = query.siteIds.filter((siteId) => validSiteIds.has(siteId));
  const status = ATTENDANCE_STATUSES.includes(query.status as AttendanceStatus)
    ? (query.status as AttendanceStatus)
    : null;
  const sessions = await loadAttendanceLedger(supabase, {
    limit: 500,
    siteIds,
    from: query.from,
    to: query.to,
    search: query.search,
    status,
    overtime: query.overtime,
    sort: query.sort,
    direction: query.direction,
  });
  const groups = groupBySite(sessions, sites, (session) => session.site_id);

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Evidence · Review</p>
          <h1>Attendance ledger</h1>
          <p>Each site has its own searchable attendance ledger.</p>
        </div>
      </header>
      <article className="panel">
        <ExportControls sites={sites} />
      </article>
      <article className="panel">
        <LedgerToolbar
          direction={query.direction}
          from={query.from}
          includeDates
          overtime={query.overtime}
          search={query.search}
          selectedSiteIds={siteIds}
          sites={sites}
          sort={query.sort}
          sortOptions={[
            { value: "date", label: "Date and time" },
            { value: "employee", label: "Employee name" },
            { value: "site", label: "Site name" },
            { value: "hours", label: "Hours" },
            { value: "status", label: "Status" },
          ]}
          status={status}
          statusOptions={ATTENDANCE_STATUSES.map((value) => ({
            value,
            label: value[0].toUpperCase() + value.slice(1),
          }))}
          to={query.to}
        />
        <SiteLedgerGroups
          groups={groups}
          render={(group) => (
            <AttendanceLedger role={profile.role} rows={group.rows} />
          )}
        />
      </article>
    </section>
  );
}
