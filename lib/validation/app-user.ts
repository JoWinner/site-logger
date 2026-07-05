import { z } from "zod";

import { normalizeUsername } from "@/lib/auth/username";
import type { AppRole } from "@/lib/database.types";

const assignedUserFields = {
  role: z.enum(["timekeeper", "admin", "super_admin"]),
  assignedSiteId: z.uuid().nullable(),
};

function requireTimekeeperSite<
  T extends { role: AppRole; assignedSiteId: string | null },
>(data: T, context: z.RefinementCtx) {
  if (data.role === "timekeeper" && !data.assignedSiteId) {
    context.addIssue({
      code: "custom",
      path: ["assignedSiteId"],
      message: "Select an assigned site for the Timekeeper.",
    });
  }
}

export const createAppUserSchema = z.object({
  username: z.string().transform((value, context) => {
    try {
      return normalizeUsername(value);
    } catch (error) {
      context.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "Invalid username.",
      });
      return z.NEVER;
    }
  }),
  displayName: z.string().trim().min(1).max(120),
  password: z.string().min(10).max(200),
  ...assignedUserFields,
}).superRefine(requireTimekeeperSite).transform((data) => ({
  ...data,
  assignedSiteId:
    data.role === "timekeeper" ? data.assignedSiteId : null,
}));

export const updateAppUserSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  ...assignedUserFields,
  isActive: z.boolean(),
  password: z.string().min(10).max(200).nullable(),
}).superRefine(requireTimekeeperSite).transform((data) => ({
  ...data,
  assignedSiteId:
    data.role === "timekeeper" ? data.assignedSiteId : null,
}));

export function assertSuperAdminContinuity({
  currentRole,
  currentActive,
  nextRole,
  nextActive,
  activeSuperAdminCount,
}: {
  currentRole: AppRole;
  currentActive: boolean;
  nextRole: AppRole;
  nextActive: boolean;
  activeSuperAdminCount: number;
}) {
  const removesActiveSuperAdmin =
    currentRole === "super_admin" &&
    currentActive &&
    (nextRole !== "super_admin" || !nextActive);

  if (removesActiveSuperAdmin && activeSuperAdminCount <= 1) {
    throw new Error("The last active Super Admin cannot be removed.");
  }
}
