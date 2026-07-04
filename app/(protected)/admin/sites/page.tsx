import { SiteForm } from "@/app/(protected)/admin/sites/site-form";
import { SiteLedger } from "@/components/admin/site-ledger";
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
      <div className="master-data-stack">
        <article className="panel master-data-create">
          <h2>Add site</h2>
          <SiteForm />
        </article>
        <article className="panel">
          <div className="panel__header">
            <h2>Site ledger</h2>
            <span>{sites.length} records</span>
          </div>
          <SiteLedger sites={sites} />
        </article>
      </div>
    </section>
  );
}
