import Link from "next/link";

import { getNavigationForRole } from "@/lib/auth/permissions";
import type { AppRole } from "@/lib/database.types";

export function RoleNav({ role }: { role: AppRole }) {
  return (
    <nav className="role-nav" aria-label="Main navigation">
      {getNavigationForRole(role).map((item) => (
        <Link href={item.href} key={item.href}>
          <span>{item.eyebrow}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
