import { SiteForm } from "@/app/(protected)/admin/sites/site-form";
import { SiteLedger } from "@/components/admin/site-ledger";
import { LedgerToolbar } from "@/components/data/ledger-toolbar";
import { MasterDataImport } from "@/components/imports/master-data-import";
import { requireProfile } from "@/lib/auth/session";
import type { SiteRow } from "@/lib/database.types";
import { parseLedgerQuery } from "@/lib/tables/query-state";

export default async function SitesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase } = await requireProfile(["admin", "super_admin"]);
  const query = parseLedgerQuery(await searchParams, {
    sortKeys: ["name", "code", "updated", "status"] as const,
    defaultSort: "name",
    defaultDirection: "asc",
  });
  const { data } = await supabase.from("sites").select("*").order("name");
  const sites = (data ?? []) as unknown as SiteRow[];
  const term = query.search.toLowerCase();
  const filtered = sites
    .filter((site) =>
      (!term || [site.name, site.site_code].some((value) => value.toLowerCase().includes(term)))
      && (!query.status || (query.status === "active" ? site.is_active : !site.is_active)),
    )
    .sort((a, b) => {
      const values = {
        name: [a.name, b.name],
        code: [a.site_code, b.site_code],
        updated: [a.updated_at, b.updated_at],
        status: [String(a.is_active), String(b.is_active)],
      }[query.sort];
      const compared = values[0].localeCompare(values[1]);
      return query.direction === "asc" ? compared : -compared;
    });

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Places · Master data</p>
          <h1>Construction sites</h1>
          <p>Site codes are permanent references; daily site codes are not used.</p>
        </div>
      </header>
      <div className="master-data-stack">
        <article className="panel master-data-create">
          <h2>Add site</h2>
          <SiteForm />
        </article>
        <article className="panel">
          <div className="panel__header">
            <h2>Import sites</h2>
            <span>CSV / XLSX</span>
          </div>
          <MasterDataImport entity="sites" />
        </article>
        <article className="panel">
          <div className="panel__header">
            <h2>Site ledger</h2>
            <span>{filtered.length} of {sites.length} records</span>
          </div>
          <LedgerToolbar
            direction={query.direction}
            search={query.search}
            sort={query.sort}
            sortOptions={[
              { value: "name", label: "Site name" },
              { value: "code", label: "Site code" },
              { value: "updated", label: "Last updated" },
              { value: "status", label: "Active status" },
            ]}
            status={query.status}
            statusOptions={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
          <SiteLedger sites={filtered} />
        </article>
      </div>
    </section>
  );
}
