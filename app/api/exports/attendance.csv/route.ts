import { NextResponse } from "next/server";

import { requireProfile } from "@/lib/auth/session";
import { buildAttendanceCsv } from "@/lib/exports/attendance-csv";
import { loadAuthorizedAttendanceExport } from "@/lib/exports/attendance-query";

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
    const csv = buildAttendanceCsv(data.rows);
    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          `attachment; filename="site-logger-attendance-${stamp}.csv"`,
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
