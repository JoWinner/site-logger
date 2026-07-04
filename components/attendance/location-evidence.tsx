export function LocationEvidence({
  label,
  latitude,
  longitude,
  accuracyMetres,
  mapAvailable,
}: {
  label: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracyMetres: number | null;
  mapAvailable: boolean;
}) {
  const coordinates =
    latitude === null || longitude === null
      ? "Coordinates unavailable"
      : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}${
          accuracyMetres === null ? "" : ` · ±${Math.round(accuracyMetres)} m`
        }`;

  return (
    <div className="location-evidence">
      <strong>{label ?? "Location name unavailable"}</strong>
      <span>{coordinates}</span>
      {mapAvailable && latitude !== null && longitude !== null ? (
        <div className="location-evidence__map">
          {/* Mapbox logo and attribution are included in the returned image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={`Map showing ${label ?? coordinates}`}
            loading="lazy"
            src={`/api/maps/static?latitude=${latitude}&longitude=${longitude}`}
          />
        </div>
      ) : null}
    </div>
  );
}
