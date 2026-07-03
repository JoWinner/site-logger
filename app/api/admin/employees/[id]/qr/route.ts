import { NextResponse } from "next/server";

import { requireProfile } from "@/lib/auth/session";
import { generateQrToken } from "@/lib/qr/tokens";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { profile } = await requireProfile(["admin", "super_admin"]);
  const admin = createAdminSupabaseClient();

  const { data: employee } = await admin
    .from("employees")
    .select("id, full_name, employee_id_pin, is_active")
    .eq("id", id)
    .maybeSingle();

  if (!employee?.is_active) {
    return NextResponse.json({ error: "Active employee not found." }, { status: 404 });
  }

  const now = new Date().toISOString();
  await admin
    .from("employee_qr_tokens")
    .update({ revoked_at: now, revoked_by: profile.id })
    .eq("employee_id", id)
    .is("revoked_at", null);

  const token = generateQrToken();
  const { error } = await admin.from("employee_qr_tokens").insert({
    employee_id: id,
    token_hash: token.tokenHash,
    issued_by: profile.id,
  });

  if (error) {
    return NextResponse.json({ error: "QR badge could not be issued." }, { status: 500 });
  }

  return NextResponse.json({
    rawToken: token.rawToken,
    employeeName: employee.full_name,
    employeeIdPin: employee.employee_id_pin,
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { profile } = await requireProfile(["admin", "super_admin"]);
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("employee_qr_tokens")
    .update({
      revoked_at: new Date().toISOString(),
      revoked_by: profile.id,
    })
    .eq("employee_id", id)
    .is("revoked_at", null);
  if (error) {
    return NextResponse.json({ error: "QR badge could not be revoked." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
