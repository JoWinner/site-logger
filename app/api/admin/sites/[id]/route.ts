import { NextResponse } from "next/server";

import { requireProfile } from "@/lib/auth/session";
import { siteInputSchema } from "@/lib/validation/site";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { profile, supabase } = await requireProfile(["admin", "super_admin"]);
  const parsed = siteInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the site details." }, { status: 400 });
  }
  const { error } = await supabase
    .from("sites")
    .update({
      site_code: parsed.data.siteCode,
      name: parsed.data.name,
      is_active: parsed.data.isActive,
      updated_by: profile.id,
    } as never)
    .eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: error.code === "23505" ? "That site code already exists." : "Site could not be updated." },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true });
}
