import { describe, expect, it } from "vitest";

import {
  assertSuperAdminContinuity,
  createAppUserSchema,
} from "@/lib/validation/app-user";

describe("createAppUserSchema", () => {
  it("normalizes usernames and accepts all three roles", () => {
    expect(
      createAppUserSchema.parse({
        username: " Site.Foreman ",
        displayName: "Site Foreman",
        password: "strong-pass-19",
        role: "timekeeper",
      }),
    ).toMatchObject({ username: "site.foreman", role: "timekeeper" });
  });

  it("requires a usable initial password", () => {
    expect(() =>
      createAppUserSchema.parse({
        username: "keeper",
        displayName: "Keeper",
        password: "short",
        role: "timekeeper",
      }),
    ).toThrow();
  });
});

describe("assertSuperAdminContinuity", () => {
  it("blocks deactivating or demoting the last active super admin", () => {
    expect(() =>
      assertSuperAdminContinuity({
        currentRole: "super_admin",
        currentActive: true,
        nextRole: "admin",
        nextActive: true,
        activeSuperAdminCount: 1,
      }),
    ).toThrow("The last active Super Admin cannot be removed.");
  });

  it("allows changing a super admin when another active one remains", () => {
    expect(() =>
      assertSuperAdminContinuity({
        currentRole: "super_admin",
        currentActive: true,
        nextRole: "admin",
        nextActive: true,
        activeSuperAdminCount: 2,
      }),
    ).not.toThrow();
  });
});
