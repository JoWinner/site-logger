import { NextResponse } from "next/server";

import { validateGpsEvidence } from "@/lib/attendance/gps";
import { getScanErrorMessage } from "@/lib/attendance/scan-errors";
import { requireProfile } from "@/lib/auth/session";
import { scanRequestSchema } from "@/lib/validation/scan";

interface ScanRpcResult {
  ok: boolean;
  code: string;
  event_id?: string;
  session_id?: string;
  employee_id?: string;
  employee_name?: string;
  site_name?: string;
  action?: string;
  captured_at?: string;
}

const STATUS_BY_CODE: Record<string, number> = {
  invalid_qr: 404,
  inactive_employee: 409,
  site_assignment_required: 409,
  gps_required: 400,
  already_checked_in: 409,
  no_open_session: 409,
  duplicate_request: 409,
  not_authorized: 403,
};

export async function POST(request: Request) {
  const { supabase } = await requireProfile();
  const parsed = scanRequestSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "invalid_request", message: "Complete the action, GPS, and QR scan." },
      { status: 400 },
    );
  }

  try {
    validateGpsEvidence({
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      accuracyMetres: parsed.data.accuracyMetres,
      capturedAt: parsed.data.locationCapturedAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        code: "gps_required",
        message: error instanceof Error ? error.message : getScanErrorMessage("gps_required"),
      },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.rpc(
    "record_attendance_scan",
    {
      p_raw_token: parsed.data.rawToken,
      p_action: parsed.data.action,
      p_device_captured_at: parsed.data.deviceCapturedAt,
      p_latitude: parsed.data.latitude,
      p_longitude: parsed.data.longitude,
      p_accuracy_metres: parsed.data.accuracyMetres,
      p_location_captured_at: parsed.data.locationCapturedAt,
      p_idempotency_key: parsed.data.idempotencyKey,
    } as never,
  );

  if (error) {
    return NextResponse.json(
      { ok: false, code: "server_error", message: getScanErrorMessage("server_error") },
      { status: 500 },
    );
  }

  const result = data as unknown as ScanRpcResult;
  if (!result.ok) {
    return NextResponse.json(
      {
        ...result,
        message: getScanErrorMessage(result.code),
      },
      { status: STATUS_BY_CODE[result.code] ?? 400 },
    );
  }

  return NextResponse.json({
    ...result,
    employeeName: result.employee_name,
    siteName: result.site_name,
    sessionId: result.session_id,
  });
}
