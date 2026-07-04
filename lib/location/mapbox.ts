import type {
  GeocodingMode,
  ResolvedLocation,
} from "@/lib/location/types";

interface MapboxFeature {
  properties?: {
    mapbox_id?: string;
    full_address?: string;
    name_preferred?: string;
    name?: string;
    place_formatted?: string;
  };
}

interface MapboxResponse {
  features?: MapboxFeature[];
}

function geocodingMode(): GeocodingMode {
  return process.env.MAPBOX_GEOCODING_MODE === "permanent"
    ? "permanent"
    : "temporary";
}

function featureLabel(feature: MapboxFeature): string | null {
  const properties = feature.properties;
  if (!properties) return null;
  if (properties.full_address?.trim()) return properties.full_address.trim();

  const name = properties.name_preferred?.trim() || properties.name?.trim();
  const context = properties.place_formatted?.trim();
  return [name, context].filter(Boolean).join(", ") || null;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ResolvedLocation | null> {
  const token = process.env.MAPBOX_ACCESS_TOKEN?.trim();
  if (!token) return null;

  const url = new URL("https://api.mapbox.com/search/geocode/v6/reverse");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("language", "en");
  url.searchParams.set("access_token", token);
  if (geocodingMode() === "permanent") {
    url.searchParams.set("permanent", "true");
  }

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return null;

    const result = (await response.json()) as MapboxResponse;
    const feature = result.features?.find((candidate) => featureLabel(candidate));
    if (!feature) return null;
    const label = featureLabel(feature);
    if (!label) return null;

    return {
      label,
      featureId: feature.properties?.mapbox_id ?? null,
      resolvedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
