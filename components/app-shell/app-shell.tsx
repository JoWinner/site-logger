import Link from "next/link";

import { OfflineBanner } from "@/components/app-shell/offline-banner";
import { RoleNav } from "@/components/app-shell/role-nav";
import type { ProfileRow } from "@/lib/database.types";

export function AppShell({
  profile,
  children,
}: {
  profile: ProfileRow;
  children: React.ReactNode;
}) {
  return (
    <div className="app-frame">
      <OfflineBanner />
      <header className="topbar">
        <Link className="wordmark" href="/">
          <span>SL</span>
          <strong>Site Logger</strong>
        </Link>
        <div className="operator">
          <span>{profile.role.replace("_", " ")}</span>
          <strong>{profile.display_name}</strong>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="text-button" type="submit">
            Sign out
          </button>
        </form>
      </header>
      <aside className="sidebar">
        <p className="sidebar__label">Control ledger</p>
        <RoleNav role={profile.role} />
      </aside>
      <main className="workspace">{children}</main>
    </div>
  );
}
