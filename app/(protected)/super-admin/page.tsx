import Link from "next/link";

import { requireProfile } from "@/lib/auth/session";

export default async function SuperAdminOverviewPage() {
  await requireProfile(["super_admin"]);

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Developer control</p>
          <h1>System administration</h1>
          <p>Manage access, audit operations, and maintain company records.</p>
        </div>
      </header>
      <div className="action-grid">
        <Link href="/super-admin/users">
          <span>Access</span>
          <strong>Create users, assign roles, reset passwords</strong>
        </Link>
        <Link href="/admin/attendance">
          <span>Evidence</span>
          <strong>Inspect attendance and correction history</strong>
        </Link>
        <Link href="/admin/employees">
          <span>People</span>
          <strong>Maintain employees and badges</strong>
        </Link>
      </div>
    </section>
  );
}
