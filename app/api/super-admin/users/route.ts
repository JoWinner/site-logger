import { NextResponse } from "next/server";

import { createApplicationUser } from "@/lib/auth/admin-users";
import { requireProfile } from "@/lib/auth/session";
import { createAppUserSchema } from "@/lib/validation/app-user";

export async function POST(request: Request) {
  await requireProfile(["super_admin"]);
  const parsed = createAppUserSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the username, display name, password, and role." },
      { status: 400 },
    );
  }

  try {
    const id = await createApplicationUser(parsed.data);
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "User could not be created." },
      { status: 409 },
    );
  }
}
