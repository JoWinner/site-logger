import { NextResponse } from "next/server";

import { requireProfile } from "@/lib/auth/session";
import { employeeInputSchema } from "@/lib/validation/employee";

export async function POST(request: Request) {
  const { profile, supabase } = await requireProfile(["admin", "super_admin"]);
  const parsed = employeeInputSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json({ error: "Check the employee details." }, { status: 400 });
  }

  const { error } = await supabase.from("employees").insert({
    full_name: parsed.data.fullName,
    employee_id_pin: parsed.data.employeeIdPin,
    trade_role: parsed.data.tradeRole,
    crew: parsed.data.crew,
    is_active: parsed.data.isActive,
    created_by: profile.id,
    updated_by: profile.id,
  } as never);

  if (error) {
    return NextResponse.json(
      { error: error.code === "23505" ? "That Employee ID/PIN is already in use." : "Employee could not be saved." },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
