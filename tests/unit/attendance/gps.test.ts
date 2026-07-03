import { describe, expect, it } from "vitest";

import { validateGpsEvidence } from "@/lib/attendance/gps";

const now = new Date("2026-07-03T10:00:00.000Z");

describe("validateGpsEvidence", () => {
  it("accepts a fresh, bounded GPS reading", () => {
    expect(
      validateGpsEvidence(
        {
          latitude: 64.1466,
          longitude: -21.9426,
          accuracyMetres: 18.5,
          capturedAt: "2026-07-03T09:59:30.000Z",
        },
        now,
      ),
    ).toMatchObject({ accuracyMetres: 18.5 });
  });

  it("rejects impossible coordinates", () => {
    expect(() =>
      validateGpsEvidence(
        {
          latitude: 91,
          longitude: -21,
          accuracyMetres: 10,
          capturedAt: now.toISOString(),
        },
        now,
      ),
    ).toThrow("GPS coordinates are invalid.");
  });

  it("rejects stale location evidence", () => {
    expect(() =>
      validateGpsEvidence(
        {
          latitude: 64,
          longitude: -21,
          accuracyMetres: 10,
          capturedAt: "2026-07-03T09:49:59.000Z",
        },
        now,
      ),
    ).toThrow("GPS reading is stale. Capture location again.");
  });

  it("requires positive accuracy", () => {
    expect(() =>
      validateGpsEvidence(
        {
          latitude: 64,
          longitude: -21,
          accuracyMetres: 0,
          capturedAt: now.toISOString(),
        },
        now,
      ),
    ).toThrow("GPS accuracy is invalid.");
  });
});
