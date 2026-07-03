import { NextResponse } from "next/server";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/session";

const correctionSchema = z.object({
  checkInAt: z.iso.datetime(),
  checkOutAt: z.iso.datetime().nullable(),
  reason: z.string().trim().min(3).max(500),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { supabase } = await requireProfile(["admin", "super_admin"]);
  const parsed = correctionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the correction times and reason." }, { status: 400 });
  }
  const { error } = await supabase.rpc(
    "correct_attendance_session" as never,
    {
      p_session_id: id,
      p_check_in_at: parsed.data.checkInAt,
      p_check_out_at: parsed.data.checkOutAt,
      p_reason: parsed.data.reason,
    } as never,
  );
  if (error) {
    return NextResponse.json({ error: "Correction could not be recorded." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
