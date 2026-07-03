import { usernameToInternalEmail } from "@/lib/auth/username";
import type { AppRole, ProfileRow } from "@/lib/database.types";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  assertSuperAdminContinuity,
  type createAppUserSchema,
} from "@/lib/validation/app-user";
import type { z } from "zod";

type CreateUserInput = z.infer<typeof createAppUserSchema>;

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

export async function createApplicationUser(
  input: CreateUserInput,
  actorId: string,
) {
  const admin = createAdminSupabaseClient();
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
  input: {
    displayName: string;
    role: AppRole;
    isActive: boolean;
    password: string | null;
  },
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

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      display_name: input.displayName,
      role: input.role,
      is_active: input.isActive,
    })
    .eq("id", id);

  if (profileError) throw new Error("Application profile could not be updated.");

  const authUpdate: { password?: string; ban_duration?: string } = {
    ban_duration: input.isActive ? "none" : "876000h",
  };
  if (input.password) authUpdate.password = input.password;

  const { error: authError } = await admin.auth.admin.updateUserById(
    id,
    authUpdate,
  );
  if (authError) throw new Error("Authentication account could not be updated.");

  const { error: auditError } = await admin.from("audit_logs").insert(
    buildUserAuditEntry({
      actorId,
      action: "user_updated",
      userId: id,
      previousValues: {
        display_name: current.display_name,
        role: current.role,
        is_active: current.is_active,
      },
      newValues: {
        display_name: input.displayName,
        role: input.role,
        is_active: input.isActive,
        password_reset: Boolean(input.password),
      },
    }),
  );
  if (auditError) throw new Error("User changed, but its audit record failed.");
}
