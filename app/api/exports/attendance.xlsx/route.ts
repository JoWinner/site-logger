import { NextResponse } from "next/server";

import { requireProfile } from "@/lib/auth/session";
import { loadAuthorizedAttendanceExport } from "@/lib/exports/attendance-query";
import { buildAttendanceWorkbook } from "@/lib/exports/attendance-workbook";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { profile, supabase } = await requireProfile();
  const url = new URL(request.url);

  try {
    const data = await loadAuthorizedAttendanceExport(supabase, profile, {
      from: url.searchParams.get("from") ?? "",
      to: url.searchParams.get("to") ?? "",
      siteIds: url.searchParams.getAll("site"),
    });
    const workbook = await buildAttendanceWorkbook(data.rows, data.sites);
    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(new Uint8Array(workbook), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          `attachment; filename="site-logger-attendance-${stamp}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Attendance export could not be prepared.",
      },
      { status: 400 },
    );
  }
}
