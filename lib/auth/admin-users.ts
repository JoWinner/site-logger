import { usernameToInternalEmail } from "@/lib/auth/username";
import type { AppRole, ProfileRow } from "@/lib/database.types";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  assertSuperAdminContinuity,
  type createAppUserSchema,
  type updateAppUserSchema,
} from "@/lib/validation/app-user";
import type { z } from "zod";

type CreateUserInput = z.infer<typeof createAppUserSchema>;
type UpdateUserInput = z.infer<typeof updateAppUserSchema>;

async function validateAssignedSite(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  role: AppRole,
  assignedSiteId: string | null,
) {
  if (role !== "timekeeper") return null;
  if (!assignedSiteId) {
    throw new Error("Select an assigned site for the Timekeeper.");
  }

  const { data } = await admin
    .from("sites")
    .select("id")
    .eq("id", assignedSiteId)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) {
    throw new Error("The assigned site is unavailable or inactive.");
  }

  return assignedSiteId;
}

export function buildUserAuditEntry({
  actorId,
  action,
  userId,
  previousValues,
  newValues,
}: {
  actorId: string;
  action: "user_created" | "user_updated";
  userId: string;
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown>;
}) {
  return {
    actor_id: actorId,
    action,
    entity_type: "profiles",
    entity_id: userId,
    previous_values: previousValues,
    new_values: newValues,
  };
}

export function buildAuthUserUpdate({
  currentUsername,
  username,
  isActive,
  password,
}: {
  currentUsername: string;
  username: string;
  isActive: boolean;
  password: string | null;
}) {
  return {
    ...(currentUsername !== username
      ? {
          email: usernameToInternalEmail(username),
          email_confirm: true,
        }
      : {}),
    ...(password ? { password } : {}),
    ban_duration: isActive ? "none" : "876000h",
  };
}

export async function createApplicationUser(
  input: CreateUserInput,
  actorId: string,
) {
  const admin = createAdminSupabaseClient();
  const assignedSiteId = await validateAssignedSite(
    admin,
    input.role,
    input.assignedSiteId,
  );
  const { data, error } = await admin.auth.admin.createUser({
    email: usernameToInternalEmail(input.username),
    password: input.password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Auth user could not be created.");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    username: input.username,
    display_name: input.displayName,
    role: input.role,
    assigned_site_id: assignedSiteId,
    is_active: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Error(
      profileError.code === "23505"
        ? "That username already exists."
        : "Application profile could not be created.",
    );
  }

  const { error: auditError } = await admin.from("audit_logs").insert(
    buildUserAuditEntry({
      actorId,
      action: "user_created",
      userId: data.user.id,
      previousValues: null,
      newValues: {
        username: input.username,
        display_name: input.displayName,
        role: input.role,
        assigned_site_id: assignedSiteId,
        is_active: true,
      },
    }),
  );
  if (auditError) {
    await admin.from("profiles").delete().eq("id", data.user.id);
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Error("User audit record could not be created.");
  }

  return data.user.id;
}

export async function updateApplicationUser(
  id: string,
  input: UpdateUserInput,
  actorId: string,
) {
  const admin = createAdminSupabaseClient();
  const { data: currentData } = await admin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const current = currentData as ProfileRow | null;

  if (!current) throw new Error("Application user not found.");
  const assignedSiteId = await validateAssignedSite(
    admin,
    input.role,
    input.assignedSiteId,
  );

  const { count } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "super_admin")
    .eq("is_active", true);

  assertSuperAdminContinuity({
    currentRole: current.role,
    currentActive: current.is_active,
    nextRole: input.role,
    nextActive: input.isActive,
    activeSuperAdminCount: count ?? 0,
  });

  const { data: usernameOwner, error: usernameLookupError } = await admin
    .from("profiles")
    .select("id")
    .eq("username", input.username)
    .neq("id", id)
    .maybeSingle();

  if (usernameLookupError) {
    throw new Error("Username availability could not be checked.");
  }
  if (usernameOwner) {
    throw new Error("That username already exists.");
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      username: input.username,
      display_name: input.displayName,
      role: input.role,
      assigned_site_id: assignedSiteId,
      is_active: input.isActive,
    })
    .eq("id", id);

  if (profileError) {
    throw new Error(
      profileError.code === "23505"
        ? "That username already exists."
        : "Application profile could not be updated.",
    );
  }

  const { error: authError } = await admin.auth.admin.updateUserById(
    id,
    buildAuthUserUpdate({
      currentUsername: current.username,
      username: input.username,
      isActive: input.isActive,
      password: input.password,
    }),
  );
  if (authError) {
    const { error: rollbackError } = await admin
      .from("profiles")
      .update({
        username: current.username,
        display_name: current.display_name,
        role: current.role,
        assigned_site_id: current.assigned_site_id,
        is_active: current.is_active,
      })
      .eq("id", id);

    if (rollbackError) {
      throw new Error(
        "Authentication account could not be updated and the profile could not be restored.",
      );
    }

    const usernameConflict =
      current.username !== input.username &&
      /already|registered|exists|duplicate/i.test(authError.message);
    throw new Error(
      usernameConflict
        ? "That username already exists."
        : "Authentication account could not be updated.",
    );
  }

  const { error: auditError } = await admin.from("audit_logs").insert(
    buildUserAuditEntry({
      actorId,
      action: "user_updated",
      userId: id,
      previousValues: {
        username: current.username,
        display_name: current.display_name,
        role: current.role,
        assigned_site_id: current.assigned_site_id,
        is_active: current.is_active,
      },
      newValues: {
        username: input.username,
        display_name: input.displayName,
        role: input.role,
        assigned_site_id: assignedSiteId,
        is_active: input.isActive,
        password_reset: Boolean(input.password),
      },
    }),
  );
  if (auditError) throw new Error("User changed, but its audit record failed.");
}
