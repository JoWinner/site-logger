import { EmployeeForm } from "@/app/(protected)/admin/employees/employee-form";
import { EmployeeLedger } from "@/components/admin/employee-ledger";
import { LedgerToolbar } from "@/components/data/ledger-toolbar";
import { SiteLedgerGroups } from "@/components/data/site-ledger-groups";
import { MasterDataImport } from "@/components/imports/master-data-import";
import { requireProfile } from "@/lib/auth/session";
import type { EmployeeRow, SiteRow } from "@/lib/database.types";
import { groupBySite, parseLedgerQuery } from "@/lib/tables/query-state";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase } = await requireProfile(["admin", "super_admin"]);
  const query = parseLedgerQuery(await searchParams, {
    sortKeys: ["name", "site", "updated", "status"] as const,
    defaultSort: "name",
    defaultDirection: "asc",
  });
  const [{ data }, { data: siteData }] = await Promise.all([
    supabase.from("employees").select("*").order("full_name"),
    supabase.from("sites").select("*").order("name"),
  ]);
  const employees = (data ?? []) as unknown as EmployeeRow[];
  const sites = (siteData ?? []) as unknown as SiteRow[];
  const siteNames = new Map(sites.map((site) => [site.id, site.name]));
  const term = query.search.toLowerCase();
  const filtered = employees
    .filter((employee) => {
      const siteId = employee.current_site_id ?? "unassigned";
      const matchesSite =
        query.siteIds.length === 0 || query.siteIds.includes(siteId);
      const matchesStatus =
        !query.status
        || (query.status === "active" ? employee.is_active : !employee.is_active);
      const matchesSearch =
        !term
        || [
          employee.full_name,
          employee.employee_id_pin,
          employee.trade_role,
          employee.current_site_id
            ? siteNames.get(employee.current_site_id)
            : "Unassigned",
        ].some((value) => value?.toLowerCase().includes(term));
      return matchesSite && matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      const values = {
        name: [a.full_name, b.full_name],
        site: [
          a.current_site_id ? siteNames.get(a.current_site_id) ?? "" : "Unassigned",
          b.current_site_id ? siteNames.get(b.current_site_id) ?? "" : "Unassigned",
        ],
        updated: [a.updated_at, b.updated_at],
        status: [String(a.is_active), String(b.is_active)],
      }[query.sort];
      const compared = values[0].localeCompare(values[1]);
      return query.direction === "asc" ? compared : -compared;
    });
  const groups = groupBySite(filtered, sites, (employee) => employee.current_site_id);

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">People · Master data</p>
          <h1>Employees</h1>
          <p>
            Employee ID/PIN is optional. Every employee is identified internally
            by their QR badge and system UUID.
          </p>
        </div>
      </header>
      <div className="master-data-stack">
        <article className="panel master-data-create">
          <h2>Add employee</h2>
          <EmployeeForm sites={sites} />
        </article>
        <article className="panel">
          <div className="panel__header">
            <h2>Import employees</h2>
            <span>CSV / XLSX</span>
          </div>
          <MasterDataImport entity="employees" />
        </article>
        <article className="panel">
          <div className="panel__header">
            <h2>Employee ledger</h2>
            <span>{filtered.length} of {employees.length} records</span>
          </div>
          <LedgerToolbar
            direction={query.direction}
            search={query.search}
            selectedSiteIds={query.siteIds}
            sites={sites}
            sort={query.sort}
            sortOptions={[
              { value: "name", label: "Employee name" },
              { value: "site", label: "Current site" },
              { value: "updated", label: "Last updated" },
              { value: "status", label: "Active status" },
            ]}
            status={query.status}
            statusOptions={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
          <SiteLedgerGroups
            groups={groups}
            render={(group) => (
              <EmployeeLedger employees={group.rows} sites={sites} />
            )}
          />
        </article>
      </div>
    </section>
  );
}
