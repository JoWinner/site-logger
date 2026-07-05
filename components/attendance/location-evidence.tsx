export function LocationEvidence({
  latitude,
  longitude,
  accuracyMetres,
}: {
  latitude: number | null;
  longitude: number | null;
  accuracyMetres: number | null;
}) {
  const coordinates =
    latitude === null || longitude === null
      ? "Coordinates unavailable"
      : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}${
          accuracyMetres === null
            ? ""
            : ` · ±${Math.round(accuracyMetres)} m`
        }`;

  return (
    <div className="location-evidence">
      <strong>GPS evidence</strong>
      <span>{coordinates}</span>
    </div>
  );
}
