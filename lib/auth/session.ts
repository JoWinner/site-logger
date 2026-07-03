import { redirect } from "next/navigation";

import { canAccessRole, getHomeForRole } from "@/lib/auth/permissions";
import type { AppRole, ProfileRow } from "@/lib/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface AuthenticatedProfile {
  profile: ProfileRow;
  userId: string;
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
}

export async function getCurrentProfile(): Promise<AuthenticatedProfile | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  const profile = data as unknown as ProfileRow | null;

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return null;
  }

  return {
    profile,
    userId: user.id,
    supabase,
  };
}

export async function requireProfile(
  allowedRoles?: AppRole[],
): Promise<AuthenticatedProfile> {
  const authenticated = await getCurrentProfile();

  if (!authenticated) redirect("/login");

  if (
    allowedRoles &&
    !canAccessRole(authenticated.profile.role, allowedRoles)
  ) {
    redirect(getHomeForRole(authenticated.profile.role));
  }

  return authenticated;
}
