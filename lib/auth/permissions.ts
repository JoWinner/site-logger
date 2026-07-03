import type { AppRole } from "@/lib/database.types";

export interface NavigationItem {
  href: string;
  label: string;
  eyebrow: string;
}

const ROLE_RANK: Record<AppRole, number> = {
  timekeeper: 1,
  admin: 2,
  super_admin: 3,
};

const NAVIGATION: Record<AppRole, NavigationItem[]> = {
  timekeeper: [
    { href: "/timekeeper", label: "Scan console", eyebrow: "Record" },
  ],
  admin: [
    { href: "/admin", label: "Overview", eyebrow: "Today" },
    { href: "/admin/attendance", label: "Attendance", eyebrow: "Review" },
    { href: "/admin/employees", label: "Employees", eyebrow: "People" },
    { href: "/admin/sites", label: "Sites", eyebrow: "Places" },
  ],
  super_admin: [
    { href: "/super-admin", label: "Overview", eyebrow: "System" },
    { href: "/admin/attendance", label: "Attendance", eyebrow: "Review" },
    { href: "/admin/employees", label: "Employees", eyebrow: "People" },
    { href: "/admin/sites", label: "Sites", eyebrow: "Places" },
    { href: "/super-admin/users", label: "Users", eyebrow: "Access" },
  ],
};

export function canAccessRole(
  currentRole: AppRole,
  allowedRoles: AppRole[],
): boolean {
  const minimumRank = Math.min(...allowedRoles.map((role) => ROLE_RANK[role]));
  return ROLE_RANK[currentRole] >= minimumRank;
}

export function getHomeForRole(role: AppRole): string {
  if (role === "super_admin") return "/super-admin";
  if (role === "admin") return "/admin";
  return "/timekeeper";
}

export function getNavigationForRole(role: AppRole): NavigationItem[] {
  return NAVIGATION[role];
}
