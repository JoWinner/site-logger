import { describe, expect, it } from "vitest";

import { authorizeAttendanceExport } from "@/lib/exports/attendance-query";
import type { ProfileRow } from "@/lib/database.types";

const admin: ProfileRow = {
  id: "admin",
  username: "admin",
  display_name: "Admin",
  role: "admin",
  assigned_site_id: null,
  is_active: true,
  created_at: "",
  updated_at: "",
};

const timekeeper: ProfileRow = {
  ...admin,
  id: "keeper",
  username: "timekeeper",
  display_name: "Frank",
  role: "timekeeper",
  assigned_site_id: "atlas",
};

describe("authorizeAttendanceExport", () => {
  it("requires valid dates and at least one Admin site", () => {
    expect(() =>
      authorizeAttendanceExport(admin, {
        from: "2026-07-05",
        to: "2026-07-01",
        siteIds: ["atlas"],
      }),
    ).toThrow(/date/i);
    expect(() =>
      authorizeAttendanceExport(admin, {
        from: "2026-07-01",
        to: "2026-07-05",
        siteIds: [],
      }),
    ).toThrow(/site/i);
  });

  it("deduplicates Admin sites and ignores Timekeeper-supplied sites", () => {
    expect(
      authorizeAttendanceExport(admin, {
        from: "2026-07-01",
        to: "2026-07-05",
        siteIds: ["atlas", "atlas", "dunes"],
      }).siteIds,
    ).toEqual(["atlas", "dunes"]);
    expect(
      authorizeAttendanceExport(timekeeper, {
        from: "2026-07-01",
        to: "2026-07-05",
        siteIds: ["dunes"],
      }),
    ).toMatchObject({ siteIds: ["atlas"], recorderId: "keeper" });
  });
});
