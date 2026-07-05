import { describe, expect, it } from "vitest";

import {
  assertSuperAdminContinuity,
  createAppUserSchema,
  updateAppUserSchema,
} from "@/lib/validation/app-user";
import {
  buildAuthUserUpdate,
  buildUserAuditEntry,
} from "@/lib/auth/admin-users";

describe("createAppUserSchema", () => {
  it("normalizes usernames and requires a site for timekeepers", () => {
    expect(
      createAppUserSchema.parse({
        username: " Site.Foreman ",
        displayName: "Site Foreman",
        password: "strong-pass-19",
        role: "timekeeper",
        assignedSiteId: "40eb6ccb-b455-479e-83f4-d88f2fd7ecb2",
      }),
    ).toMatchObject({
      username: "site.foreman",
      role: "timekeeper",
      assignedSiteId: "40eb6ccb-b455-479e-83f4-d88f2fd7ecb2",
    });
  });

  it("rejects a timekeeper without a site assignment", () => {
    expect(
      createAppUserSchema.safeParse({
        username: "keeper",
        displayName: "Keeper",
        password: "long-password",
        role: "timekeeper",
        assignedSiteId: null,
      }).success,
    ).toBe(false);
  });

  it("clears site assignment for non-timekeeper roles", () => {
    expect(
      createAppUserSchema.parse({
        username: "admin",
        displayName: "Admin",
        password: "long-password",
        role: "admin",
        assignedSiteId: null,
      }).assignedSiteId,
    ).toBeNull();
  });

  it("requires a usable initial password", () => {
    expect(() =>
      createAppUserSchema.parse({
        username: "keeper",
        displayName: "Keeper",
        password: "short",
        role: "timekeeper",
        assignedSiteId: "40eb6ccb-b455-479e-83f4-d88f2fd7ecb2",
      }),
    ).toThrow();
  });
});

describe("updateAppUserSchema", () => {
  it("normalizes the username when a Super Admin updates a user", () => {
    expect(
      updateAppUserSchema.parse({
        username: " New.Foreman ",
        displayName: "New Foreman",
        role: "admin",
        assignedSiteId: null,
        isActive: true,
        password: null,
      }).username,
    ).toBe("new.foreman");
  });
});

describe("buildAuthUserUpdate", () => {
  it("updates the internal login email when the username changes", () => {
    expect(
      buildAuthUserUpdate({
        currentUsername: "old.foreman",
        username: "new.foreman",
        isActive: true,
        password: null,
      }),
    ).toEqual({
      email: "new.foreman@site-logger.local",
      email_confirm: true,
      ban_duration: "none",
    });
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

describe("buildUserAuditEntry", () => {
  it("attributes privileged user changes to the acting Super Admin", () => {
    expect(
      buildUserAuditEntry({
        actorId: "actor-id",
        action: "user_updated",
        userId: "target-id",
        previousValues: { role: "timekeeper" },
        newValues: { role: "admin" },
      }),
    ).toEqual({
      actor_id: "actor-id",
      action: "user_updated",
      entity_type: "profiles",
      entity_id: "target-id",
      previous_values: { role: "timekeeper" },
      new_values: { role: "admin" },
    });
  });
});
