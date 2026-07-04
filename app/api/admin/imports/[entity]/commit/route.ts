import { NextResponse } from "next/server";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/session";
import type { ImportEntity } from "@/lib/imports/types";
import { employeeInputSchema } from "@/lib/validation/employee";
import { siteInputSchema } from "@/lib/validation/site";

const requestSchema = z.object({
  rows: z.array(z.unknown()).min(1).max(2_000),
});

function importEntity(value: string): ImportEntity | null {
  if (value === "employees" || value === "sites") return value;
  return null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ entity: string }> },
) {
  const { entity: value } = await context.params;
  const entity = importEntity(value);
  if (!entity) {
    return NextResponse.json({ error: "Unknown import type." }, { status: 404 });
  }

  const { supabase } = await requireProfile(["admin", "super_admin"]);
  const parsedRequest = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "Import rows are missing or invalid." },
      { status: 400 },
    );
  }

  const schema = entity === "employees" ? employeeInputSchema : siteInputSchema;
  const rows = parsedRequest.data.rows.map((row) => schema.safeParse(row));
  if (rows.some((row) => !row.success)) {
    return NextResponse.json(
      { error: "Import rows changed after preview. Preview the file again." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.rpc(
    entity === "employees" ? "import_employees" : "import_sites",
    {
      p_rows: rows.map((row) => row.data),
    } as never,
  );

  if (error) {
    return NextResponse.json(
      { error: "The import could not be committed. No records were changed." },
      { status: 409 },
    );
  }

  return NextResponse.json(data);
}
