"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getNavigationForRole } from "@/lib/auth/permissions";
import type { AppRole } from "@/lib/database.types";

export function RoleNav({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const navigation = getNavigationForRole(role);
  const activeHref = navigation
    .filter(
      (item) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((left, right) => right.href.length - left.href.length)[0]?.href;

  return (
    <nav className="role-nav" aria-label="Main navigation">
      {navigation.map((item) => (
        <Link
          aria-current={item.href === activeHref ? "page" : undefined}
          className={
            item.href === activeHref ? "role-nav__link--active" : undefined
          }
          href={item.href}
          key={item.href}
        >
          <span>{item.eyebrow}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
