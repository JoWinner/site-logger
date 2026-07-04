import type { ImportEntity } from "@/lib/imports/types";

const EMPLOYEE_ALIASES: Record<string, string> = {
  fullname: "fullName",
  employeename: "fullName",
  workername: "fullName",
  employee: "fullName",
  employeeidpin: "employeeIdPin",
  employeeid: "employeeIdPin",
  idpin: "employeeIdPin",
  pin: "employeeIdPin",
  traderole: "tradeRole",
  trade: "tradeRole",
  role: "tradeRole",
  jobrole: "tradeRole",
  occupation: "tradeRole",
  crew: "crew",
  team: "crew",
  group: "crew",
  active: "isActive",
  isactive: "isActive",
  status: "isActive",
};

const SITE_ALIASES: Record<string, string> = {
  sitecode: "siteCode",
  jobsitecode: "siteCode",
  code: "siteCode",
  sitename: "name",
  jobsite: "name",
  name: "name",
  site: "name",
  active: "isActive",
  isactive: "isActive",
  status: "isActive",
};

export function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function getCanonicalHeader(
  entity: ImportEntity,
  value: unknown,
): string | null {
  const aliases = entity === "employees" ? EMPLOYEE_ALIASES : SITE_ALIASES;
  return aliases[normalizeHeader(value)] ?? null;
}

export function hasRequiredHeaders(
  entity: ImportEntity,
  headers: Iterable<string>,
): boolean {
  const values = new Set(headers);
  if (entity === "employees") return values.has("fullName");
  return values.has("siteCode") && values.has("name");
}
