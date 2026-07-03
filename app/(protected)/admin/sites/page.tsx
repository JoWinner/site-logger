import { SiteForm } from "@/app/(protected)/admin/sites/site-form";
import { requireProfile } from "@/lib/auth/session";
import type { SiteRow } from "@/lib/database.types";

export default async function SitesPage() {
  const { supabase } = await requireProfile(["admin", "super_admin"]);
  const { data } = await supabase.from("sites").select("*").order("name");
  const sites = (data ?? []) as unknown as SiteRow[];

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Places · Master data</p>
          <h1>Construction sites</h1>
          <p>Site codes are permanent references; daily site codes are not used.</p>
        </div>
      </header>
      <div className="split-layout">
        <article className="panel">
          <h2>Add site</h2>
          <SiteForm />
        </article>
        <article className="panel panel--wide">
          <div className="panel__header">
            <h2>Site ledger</h2>
            <span>{sites.length} records</span>
          </div>
          <div className="record-list">
            {sites.map((site) => (
              <details className="record-row" key={site.id}>
                <summary>
                  <span className={`status-pip ${site.is_active ? "is-active" : ""}`} />
                  <strong>{site.name}</strong>
                  <span>{site.site_code}</span>
                </summary>
                <div className="record-row__body">
                  <SiteForm
                    site={{
                      id: site.id,
                      siteCode: site.site_code,
                      name: site.name,
                      isActive: site.is_active,
                    }}
                  />
                </div>
              </details>
            ))}
            {sites.length === 0 ? <p className="empty-copy">No sites yet.</p> : null}
          </div>
        </article>
      </div>
    </section>
  );
}
