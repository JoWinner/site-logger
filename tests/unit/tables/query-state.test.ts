import { describe, expect, it } from "vitest";

import { groupBySite, parseLedgerQuery } from "@/lib/tables/query-state";
import type { SiteRow } from "@/lib/database.types";

const sites: SiteRow[] = [
  {
    id: "site-b",
    site_code: "BETA",
    name: "Beta",
    is_active: true,
    created_by: null,
    updated_by: null,
    created_at: "",
    updated_at: "",
  },
  {
    id: "site-a",
    site_code: "ATLAS",
    name: "Atlas",
    is_active: true,
    created_by: null,
    updated_by: null,
    created_at: "",
    updated_at: "",
  },
];

describe("parseLedgerQuery", () => {
  it("normalizes search, sorting, direction, and repeated sites", () => {
    expect(
      parseLedgerQuery(
        {
          q: "  mason  ",
          sort: "unknown",
          dir: "sideways",
          site: ["site-a", "site-a", "site-b"],
        },
        {
          sortKeys: ["name", "updated"] as const,
          defaultSort: "name",
          defaultDirection: "asc",
        },
      ),
    ).toMatchObject({
      search: "mason",
      sort: "name",
      direction: "asc",
      siteIds: ["site-a", "site-b"],
    });
  });

  it("rejects a reversed date range", () => {
    expect(() =>
      parseLedgerQuery(
        { from: "2026-07-05", to: "2026-07-01" },
        {
          sortKeys: ["date"] as const,
          defaultSort: "date",
          defaultDirection: "desc",
        },
      ),
    ).toThrow(/date range/i);
  });
});

describe("groupBySite", () => {
  it("orders site groups by name and appends Unassigned", () => {
    const rows = [
      { id: "3", siteId: null },
      { id: "2", siteId: "site-b" },
      { id: "1", siteId: "site-a" },
    ];

    expect(
      groupBySite(rows, sites, (row) => row.siteId).map((group) => group.label),
    ).toEqual(["Atlas", "Beta", "Unassigned"]);
  });
});
