import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/scans/route";

const testState = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireProfile: vi.fn().mockResolvedValue({
    supabase: {
      rpc: testState.rpc,
    },
  }),
}));

function scanRequest() {
  const capturedAt = new Date().toISOString();
  return new Request("http://localhost/api/scans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rawToken: "raw-token-with-enough-characters",
      action: "check_in",
      deviceCapturedAt: capturedAt,
      latitude: 5.7036,
      longitude: -0.2845,
      accuracyMetres: 8,
      locationCapturedAt: capturedAt,
      idempotencyKey: "0e76edba-1bf3-487a-a66f-5c563dfe207c",
    }),
  });
}

describe("site-scoped scan recording", () => {
  afterEach(() => {
    testState.rpc.mockReset();
  });

  it("records GPS evidence without sending a client-controlled site", async () => {
    testState.rpc.mockResolvedValueOnce({
      data: {
        ok: true,
        code: "recorded",
        event_id: "event-1",
        session_id: "session-1",
        employee_name: "Marcus Hill",
        site_name: "Atlas",
      },
      error: null,
    });

    const response = await POST(scanRequest());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.siteName).toBe("Atlas");
    expect(testState.rpc).toHaveBeenCalledWith(
      "record_attendance_scan",
      expect.not.objectContaining({
        p_site_id: expect.anything(),
      }),
    );
  });
});
