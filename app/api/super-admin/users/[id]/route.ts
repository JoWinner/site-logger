import { NextResponse } from "next/server";

import { updateApplicationUser } from "@/lib/auth/admin-users";
import { requireProfile } from "@/lib/auth/session";
import { updateAppUserSchema } from "@/lib/validation/app-user";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  await requireProfile(["super_admin"]);
  const parsed = updateAppUserSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the user settings." }, { status: 400 });
  }

  try {
    await updateApplicationUser(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "User could not be updated." },
      { status: 409 },
    );
  }
}
