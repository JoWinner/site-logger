import { describe, expect, it } from "vitest";

import {
  classifyEmployeeRows,
  classifySiteRows,
} from "@/lib/imports/classify";
import type { EmployeeRow, SiteRow } from "@/lib/database.types";

const existingEmployee: EmployeeRow = {
  id: "employee-1",
  employee_id_pin: "E001",
  full_name: "Marcus Hill",
  trade_role: "Carpenter",
  current_site_id: null,
  is_active: true,
  created_by: null,
  updated_by: null,
  created_at: "2026-07-01T10:00:00.000Z",
  updated_at: "2026-07-01T10:00:00.000Z",
};

const existingSite: SiteRow = {
  id: "40eb6ccb-b455-479e-83f4-d88f2fd7ecb2",
  site_code: "ATLAS",
  name: "Atlas",
  is_active: true,
  created_by: null,
  updated_by: null,
  created_at: "2026-07-01T10:00:00.000Z",
  updated_at: "2026-07-01T10:00:00.000Z",
};

describe("import classification", () => {
  it("updates employees by ID and warns on ID-less duplicate names", () => {
    const rows = classifyEmployeeRows(
      [
        {
          rowNumber: 2,
          values: { fullName: "Marcus Hill", employeeIdPin: "e001" },
        },
        {
          rowNumber: 3,
          values: { fullName: "Marcus Hill", employeeIdPin: null },
        },
      ],
      [existingEmployee],
      [existingSite],
    );

    expect(rows[0]).toMatchObject({
      disposition: "update",
      value: { employeeIdPin: "E001" },
    });
    expect(rows[1]).toMatchObject({
      disposition: "warning",
      value: { employeeIdPin: null },
    });
    expect(rows[1].messages[0]).toMatch(/same name/i);
  });

  it("resolves employee Current Site by code or name", () => {
    const rows = classifyEmployeeRows(
      [
        {
          rowNumber: 2,
          values: { fullName: "Andre Cole", siteCode: "atlas" },
        },
        {
          rowNumber: 3,
          values: { fullName: "Luis Rivera", siteName: "Atlas" },
        },
      ],
      [],
      [existingSite],
    );

    expect(rows.map((row) => row.value?.currentSiteId)).toEqual([
      "40eb6ccb-b455-479e-83f4-d88f2fd7ecb2",
      "40eb6ccb-b455-479e-83f4-d88f2fd7ecb2",
    ]);
  });

  it("rejects an unknown employee Current Site", () => {
    const [row] = classifyEmployeeRows(
      [
        {
          rowNumber: 4,
          values: { fullName: "Unknown Worker", siteCode: "MISSING" },
        },
      ],
      [],
      [existingSite],
    );

    expect(row).toMatchObject({ disposition: "error", value: null });
    expect(row.messages.join(" ")).toMatch(/site/i);
  });

  it("updates sites by permanent Site Code", () => {
    const rows = classifySiteRows(
      [
        {
          rowNumber: 2,
          values: { siteCode: "atlas", name: "Atlas Updated" },
        },
      ],
      [existingSite],
    );

    expect(rows[0]).toMatchObject({
      disposition: "update",
      value: { siteCode: "ATLAS", name: "Atlas Updated" },
    });
  });

  it("reports invalid rows without a normalized value", () => {
    const rows = classifyEmployeeRows(
      [{ rowNumber: 8, values: { employeeIdPin: "E008" } }],
      [],
      [existingSite],
    );

    expect(rows[0].disposition).toBe("error");
    expect(rows[0].value).toBeNull();
    expect(rows[0].messages.length).toBeGreaterThan(0);
  });
});
