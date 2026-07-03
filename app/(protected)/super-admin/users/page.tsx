import { UserForm } from "@/app/(protected)/super-admin/users/user-form";
import { requireProfile } from "@/lib/auth/session";
import type { ProfileRow } from "@/lib/database.types";

export default async function UsersPage() {
  const { supabase } = await requireProfile(["super_admin"]);
  const { data } = await supabase.from("profiles").select("*").order("display_name");
  const users = (data ?? []) as unknown as ProfileRow[];

  return (
    <section>
      <header className="page-header"><div><p className="eyebrow">Access · Super Admin</p><h1>System users</h1><p>Users sign in with a username and password. Public registration is disabled.</p></div></header>
      <div className="split-layout">
        <article className="panel"><h2>Create user</h2><UserForm /></article>
        <article className="panel panel--wide">
          <div className="panel__header"><h2>Access ledger</h2><span>{users.length} users</span></div>
          <div className="record-list">
            {users.map((user) => (
              <details className="record-row" key={user.id}>
                <summary><span className={`status-pip ${user.is_active ? "is-active" : ""}`} /><strong>{user.display_name}</strong><span>@{user.username}</span><span>{user.role.replace("_", " ")}</span></summary>
                <div className="record-row__body"><UserForm user={{ id: user.id, displayName: user.display_name, role: user.role, isActive: user.is_active }} /></div>
              </details>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
