import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/scans/route";

const testState = vi.hoisted(() => ({
  rpc: vi.fn(),
  reverseGeocode: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireProfile: vi.fn().mockResolvedValue({
    supabase: {
      rpc: testState.rpc,
    },
  }),
}));

vi.mock("@/lib/location/mapbox", () => ({
  reverseGeocode: testState.reverseGeocode,
}));

function scanRequest() {
  const capturedAt = new Date().toISOString();
  return new Request("http://localhost/api/scans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rawToken: "raw-token-with-enough-characters",
      siteId: "1edc3fc0-06d8-4d8c-965b-a5547a341bf6",
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

describe("scan location resolution", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    testState.rpc.mockReset();
    testState.reverseGeocode.mockReset();
  });

  it("stores resolved labels after a permanent-mode scan", async () => {
    vi.stubEnv("MAPBOX_GEOCODING_MODE", "permanent");
    testState.reverseGeocode.mockResolvedValue({
      label: "Pokuase Station, Greater Accra, Ghana",
      featureId: "mapbox-id",
      resolvedAt: "2026-07-04T07:00:02.000Z",
    });
    testState.rpc
      .mockResolvedValueOnce({
        data: {
          ok: true,
          code: "recorded",
          event_id: "event-1",
          session_id: "session-1",
          employee_name: "Marcus Hill",
          site_name: "Pokuase",
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: {}, error: null });

    const response = await POST(scanRequest());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.locationLabel).toBe(
      "Pokuase Station, Greater Accra, Ghana",
    );
    expect(result.locationStored).toBe(true);
    expect(testState.rpc).toHaveBeenNthCalledWith(
      2,
      "resolve_attendance_location",
      expect.objectContaining({
        p_event_id: "event-1",
        p_location_label: "Pokuase Station, Greater Accra, Ghana",
      }),
    );
  });
});
