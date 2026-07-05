import { NextResponse } from "next/server";

import { requireProfile } from "@/lib/auth/session";
import { siteInputSchema } from "@/lib/validation/site";

export async function POST(request: Request) {
  const { profile, supabase } = await requireProfile(["admin", "super_admin"]);
  const parsed = siteInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the site details." }, { status: 400 });
  }
  const { error } = await supabase.from("sites").insert({
    site_code: parsed.data.siteCode,
    name: parsed.data.name,
    is_active: parsed.data.isActive,
    created_by: profile.id,
    updated_by: profile.id,
  } as never);
  if (error) {
    return NextResponse.json(
      {
        error:
          error.code === "23505"
            ? `Site code ${parsed.data.siteCode} is already in use. Enter a different code for each site.`
            : "Site could not be saved.",
      },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
