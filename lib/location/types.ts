export type GeocodingMode = "temporary" | "permanent";

export interface ResolvedLocation {
  label: string;
  featureId: string | null;
  resolvedAt: string;
}
