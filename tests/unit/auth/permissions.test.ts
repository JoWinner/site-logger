import { describe, expect, it } from "vitest";

import {
  canAccessRole,
  getHomeForRole,
  getNavigationForRole,
} from "@/lib/auth/permissions";

describe("role permissions", () => {
  it("keeps timekeepers inside operational routes", () => {
    expect(canAccessRole("timekeeper", ["timekeeper"])).toBe(true);
    expect(canAccessRole("timekeeper", ["admin", "super_admin"])).toBe(false);
    expect(getHomeForRole("timekeeper")).toBe("/timekeeper");
    expect(getNavigationForRole("timekeeper").map((item) => item.href)).toEqual([
      "/timekeeper",
    ]);
  });

  it("gives admins operational and administration navigation", () => {
    expect(canAccessRole("admin", ["admin", "super_admin"])).toBe(true);
    expect(getHomeForRole("admin")).toBe("/admin");
    expect(getNavigationForRole("admin").map((item) => item.href)).toEqual([
      "/admin",
      "/admin/attendance",
      "/admin/employees",
      "/admin/sites",
    ]);
  });

  it("reserves user management for super admins", () => {
    expect(getHomeForRole("super_admin")).toBe("/super-admin");
    expect(
      getNavigationForRole("super_admin").some(
        (item) => item.href === "/super-admin/users",
      ),
    ).toBe(true);
    expect(
      getNavigationForRole("admin").some(
        (item) => item.href === "/super-admin/users",
      ),
    ).toBe(false);
  });
});
