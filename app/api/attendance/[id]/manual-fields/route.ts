import { NextResponse } from "next/server";

import { requireProfile } from "@/lib/auth/session";
import { manualFieldsSchema } from "@/lib/validation/manual-fields";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { supabase } = await requireProfile();
  const parsed = manualFieldsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the manual review values." }, { status: 400 });
  }
  const { error } = await supabase.rpc(
    "update_attendance_manual_fields",
    {
      p_session_id: id,
      p_overtime_check: parsed.data.overtimeCheck,
      p_assignment_check: parsed.data.assignmentCheck,
      p_payroll_status: parsed.data.payrollStatus,
      p_notes: parsed.data.notes,
    } as never,
  );
  if (error) {
    return NextResponse.json({ error: error.code === "42501" ? "You cannot edit this attendance session." : "Manual review could not be saved." }, { status: error.code === "42501" ? 403 : 500 });
  }
  return NextResponse.json({ ok: true });
}
