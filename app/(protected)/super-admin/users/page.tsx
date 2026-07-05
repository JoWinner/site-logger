import { UserForm } from "@/app/(protected)/super-admin/users/user-form";
import { LedgerToolbar } from "@/components/data/ledger-toolbar";
import { requireProfile } from "@/lib/auth/session";
import type { ProfileRow, SiteRow } from "@/lib/database.types";
import { parseLedgerQuery } from "@/lib/tables/query-state";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase } = await requireProfile(["super_admin"]);
  const query = parseLedgerQuery(await searchParams, {
    sortKeys: ["name", "username", "role", "status"] as const,
    defaultSort: "name",
    defaultDirection: "asc",
  });
  const [{ data }, { data: siteData }] = await Promise.all([
    supabase.from("profiles").select("*").order("display_name"),
    supabase.from("sites").select("*").eq("is_active", true).order("name"),
  ]);
  const users = (data ?? []) as unknown as ProfileRow[];
  const sites = (siteData ?? []) as unknown as SiteRow[];
  const term = query.search.toLowerCase();
  const filtered = users
    .filter((user) => {
      const siteId = user.assigned_site_id ?? "unassigned";
      return (
        (query.siteIds.length === 0 || query.siteIds.includes(siteId))
        && (!query.status || (query.status === "active" ? user.is_active : !user.is_active))
        && (!term || [user.display_name, user.username, user.role].some((value) => value.toLowerCase().includes(term)))
      );
    })
    .sort((a, b) => {
      const values = {
        name: [a.display_name, b.display_name],
        username: [a.username, b.username],
        role: [a.role, b.role],
        status: [String(a.is_active), String(b.is_active)],
      }[query.sort];
      const compared = values[0].localeCompare(values[1]);
      return query.direction === "asc" ? compared : -compared;
    });

  return (
    <section>
      <header className="page-header"><div><p className="eyebrow">Access · Super Admin</p><h1>System users</h1><p>Users sign in with a username and password. Public registration is disabled.</p></div></header>
      <div className="split-layout">
        <article className="panel"><h2>Create user</h2><UserForm sites={sites} /></article>
        <article className="panel panel--wide">
          <div className="panel__header"><h2>Access ledger</h2><span>{filtered.length} of {users.length} users</span></div>
          <LedgerToolbar
            direction={query.direction}
            search={query.search}
            selectedSiteIds={query.siteIds}
            sites={sites}
            sort={query.sort}
            sortOptions={[
              { value: "name", label: "Display name" },
              { value: "username", label: "Username" },
              { value: "role", label: "Role" },
              { value: "status", label: "Active status" },
            ]}
            status={query.status}
            statusOptions={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
          <div className="record-list">
            {filtered.map((user) => (
              <details className="record-row" key={user.id}>
                <summary><span className={`status-pip ${user.is_active ? "is-active" : ""}`} /><strong>{user.display_name}</strong><span>@{user.username}</span><span>{user.role.replace("_", " ")}</span></summary>
                <div className="record-row__body"><UserForm sites={sites} user={{ id: user.id, username: user.username, displayName: user.display_name, role: user.role, assignedSiteId: user.assigned_site_id, isActive: user.is_active }} /></div>
              </details>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
