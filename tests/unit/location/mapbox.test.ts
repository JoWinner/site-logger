import { afterEach, describe, expect, it, vi } from "vitest";

import { reverseGeocode } from "@/lib/location/mapbox";

describe("reverseGeocode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("requests and returns permanent Mapbox location evidence", async () => {
    vi.stubEnv("MAPBOX_ACCESS_TOKEN", "private-mapbox-token");
    vi.stubEnv("MAPBOX_GEOCODING_MODE", "permanent");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                mapbox_id: "mapbox-id",
                full_address: "Pokuase Station, Greater Accra, Ghana",
                name: "Pokuase Station",
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await reverseGeocode(5.7036, -0.2845);

    expect(result).toMatchObject({
      label: "Pokuase Station, Greater Accra, Ghana",
      featureId: "mapbox-id",
    });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get("latitude")).toBe("5.7036");
    expect(url.searchParams.get("longitude")).toBe("-0.2845");
    expect(url.searchParams.get("permanent")).toBe("true");
    expect(url.searchParams.get("access_token")).toBe("private-mapbox-token");
  });

  it("does not request permanent storage in temporary mode", async () => {
    vi.stubEnv("MAPBOX_ACCESS_TOKEN", "private-mapbox-token");
    vi.stubEnv("MAPBOX_GEOCODING_MODE", "temporary");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ features: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await reverseGeocode(5.7036, -0.2845);

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.has("permanent")).toBe(false);
  });

  it("falls back safely when Mapbox is unavailable", async () => {
    vi.stubEnv("MAPBOX_ACCESS_TOKEN", "private-mapbox-token");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("token leaked")));

    await expect(reverseGeocode(5.7036, -0.2845)).resolves.toBeNull();
  });
});
