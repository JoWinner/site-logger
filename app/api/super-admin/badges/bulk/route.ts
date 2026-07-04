import { NextResponse } from "next/server";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/session";
import { generateQrToken } from "@/lib/qr/tokens";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const requestSchema = z.object({
  employeeIds: z
    .array(z.uuid())
    .min(1)
    .max(100)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Employee IDs must be unique.",
    }),
});

export async function POST(request: Request) {
  const { profile } = await requireProfile(["super_admin"]);
  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose between 1 and 100 unique employees." },
      { status: 400 },
    );
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("employees")
    .select("id, full_name, employee_id_pin, is_active")
    .in("id", parsed.data.employeeIds);
  if (
    error ||
    !data ||
    data.length !== parsed.data.employeeIds.length ||
    data.some((employee) => !employee.is_active)
  ) {
    return NextResponse.json(
      { error: "Every selected employee must still be active." },
      { status: 409 },
    );
  }

  const employees = new Map(data.map((employee) => [employee.id, employee]));
  const issued = parsed.data.employeeIds.map((employeeId) => ({
    employeeId,
    ...generateQrToken(),
  }));
  const { error: issueError } = await admin.rpc("issue_bulk_qr_badges", {
    p_employee_ids: issued.map((badge) => badge.employeeId),
    p_token_hashes: issued.map((badge) => badge.tokenHash),
    p_actor_id: profile.id,
  });
  if (issueError) {
    return NextResponse.json(
      { error: "No badges were issued. Check the selection and try again." },
      { status: 409 },
    );
  }

  return NextResponse.json({
    badges: issued.map((badge) => {
      const employee = employees.get(badge.employeeId)!;
      return {
        employeeId: badge.employeeId,
        employeeName: employee.full_name,
        employeeIdPin: employee.employee_id_pin,
        rawToken: badge.rawToken,
      };
    }),
  });
}
