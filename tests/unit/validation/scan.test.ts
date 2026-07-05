import { describe, expect, it } from "vitest";

import { scanRequestSchema } from "@/lib/validation/scan";

const validRequest = {
  rawToken: "abcdefghijklmnop123456789",
  action: "check_in",
  deviceCapturedAt: "2026-07-03T10:00:00.000Z",
  latitude: 64.1466,
  longitude: -21.9426,
  accuracyMetres: 22,
  locationCapturedAt: "2026-07-03T10:00:00.000Z",
  idempotencyKey: "7655c50b-8dc8-48b8-bfe6-31ad9a512534",
};

describe("scanRequestSchema", () => {
  it("accepts a complete GPS-evidenced scan", () => {
    const parsed = scanRequestSchema.parse({
      ...validRequest,
      siteId: "8d6b0c7d-c323-4fc8-a448-f8d839e647e8",
    });
    expect(parsed.action).toBe("check_in");
    expect(parsed).not.toHaveProperty("siteId");
  });

  it("rejects scans without GPS evidence", () => {
    expect(() =>
      scanRequestSchema.parse({ ...validRequest, latitude: null }),
    ).toThrow();
  });

  it("rejects unsupported attendance actions", () => {
    expect(() =>
      scanRequestSchema.parse({ ...validRequest, action: "break" }),
    ).toThrow();
  });
});
