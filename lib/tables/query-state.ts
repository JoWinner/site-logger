import type { SiteRow } from "@/lib/database.types";

type SearchValue = string | string[] | undefined;
type SearchParams = Record<string, SearchValue>;

export interface LedgerQueryDefinition<Sort extends string> {
  sortKeys: readonly Sort[];
  defaultSort: Sort;
  defaultDirection: "asc" | "desc";
}

export interface LedgerQuery<Sort extends string> {
  search: string;
  sort: Sort;
  direction: "asc" | "desc";
  siteIds: string[];
  status: string | null;
  overtime: "yes" | "no" | null;
  from: string | null;
  to: string | null;
}

function first(value: SearchValue): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function validDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(date.valueOf())
    || date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }
  return value;
}

export function parseLedgerQuery<Sort extends string>(
  params: SearchParams,
  definition: LedgerQueryDefinition<Sort>,
): LedgerQuery<Sort> {
  const requestedSort = first(params.sort);
  const sort = definition.sortKeys.includes(requestedSort as Sort)
    ? (requestedSort as Sort)
    : definition.defaultSort;
  const requestedDirection = first(params.dir);
  const direction =
    requestedDirection === "asc" || requestedDirection === "desc"
      ? requestedDirection
      : definition.defaultDirection;
  const rawSites = Array.isArray(params.site)
    ? params.site
    : params.site
      ? [params.site]
      : [];
  const siteIds = [...new Set(rawSites.map((site) => site.trim()).filter(Boolean))];
  const from = validDate(first(params.from));
  const to = validDate(first(params.to));

  if (from && to && from > to) {
    throw new Error("The date range cannot end before it starts.");
  }

  const overtimeValue = first(params.overtime);

  return {
    search: first(params.q).trim(),
    sort,
    direction,
    siteIds,
    status: first(params.status).trim() || null,
    overtime:
      overtimeValue === "yes" || overtimeValue === "no"
        ? overtimeValue
        : null,
    from,
    to,
  };
}

export interface SiteLedgerGroup<Row> {
  key: string;
  label: string;
  site: SiteRow | null;
  rows: Row[];
}

export function groupBySite<Row>(
  rows: Row[],
  sites: SiteRow[],
  getSiteId: (row: Row) => string | null,
): SiteLedgerGroup<Row>[] {
  const sitesById = new Map(sites.map((site) => [site.id, site]));
  const grouped = new Map<string, Row[]>();

  for (const row of rows) {
    const siteId = getSiteId(row) ?? "unassigned";
    grouped.set(siteId, [...(grouped.get(siteId) ?? []), row]);
  }

  const assigned = [...grouped.entries()]
    .filter(([siteId]) => siteId !== "unassigned")
    .map(([siteId, groupRows]) => {
      const site = sitesById.get(siteId) ?? null;
      return {
        key: siteId,
        label: site?.name ?? "Unknown site",
        site,
        rows: groupRows,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  const unassigned = grouped.get("unassigned");
  if (unassigned?.length) {
    assigned.push({
      key: "unassigned",
      label: "Unassigned",
      site: null,
      rows: unassigned,
    });
  }

  return assigned;
}
