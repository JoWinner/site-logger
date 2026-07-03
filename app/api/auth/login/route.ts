import { NextResponse } from "next/server";
import { z } from "zod";

import { getHomeForRole } from "@/lib/auth/permissions";
import { usernameToInternalEmail } from "@/lib/auth/username";
import type { ProfileRow } from "@/lib/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter your username and password." },
      { status: 400 },
    );
  }

  let email: string;
  try {
    email = usernameToInternalEmail(parsed.data.username);
  } catch {
    return NextResponse.json(
      { error: "The username or password is incorrect." },
      { status: 401 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: "The username or password is incorrect." },
      { status: 401 },
    );
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();
  const profile = profileData as unknown as ProfileRow | null;

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "This account is inactive. Contact a Super Admin." },
      { status: 403 },
    );
  }

  return NextResponse.json({ redirectTo: getHomeForRole(profile.role) });
}
