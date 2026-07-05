import { NextResponse } from "next/server";

import {
  classifyEmployeeRows,
  classifySiteRows,
} from "@/lib/imports/classify";
import { parseImportFile } from "@/lib/imports/parse-workbook";
import { summarizeImport, type ImportEntity } from "@/lib/imports/types";
import { requireProfile } from "@/lib/auth/session";
import type { EmployeeRow, SiteRow } from "@/lib/database.types";

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
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Choose a CSV or XLSX file." },
      { status: 400 },
    );
  }

  try {
    const rows = await parseImportFile(file, entity);

    if (entity === "employees") {
      const [
        { data, error },
        { data: siteData, error: siteError },
      ] = await Promise.all([
        supabase.from("employees").select("*").order("full_name"),
        supabase.from("sites").select("*").order("name"),
      ]);
      if (error || siteError) {
        throw new Error("Employee records could not be loaded.");
      }
      return NextResponse.json(
        summarizeImport(
          classifyEmployeeRows(
            rows,
            (data ?? []) as unknown as EmployeeRow[],
            (siteData ?? []) as unknown as SiteRow[],
          ),
        ),
      );
    }

    const { data, error } = await supabase
      .from("sites")
      .select("*")
      .order("name");
    if (error) throw new Error("Site records could not be loaded.");
    return NextResponse.json(
      summarizeImport(
        classifySiteRows(rows, (data ?? []) as unknown as SiteRow[]),
      ),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "File could not be parsed.",
      },
      { status: 400 },
    );
  }
}
