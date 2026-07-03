export interface GpsEvidence {
  latitude: number;
  longitude: number;
  accuracyMetres: number;
  capturedAt: string;
}

const MAX_GPS_AGE_MS = 10 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 60 * 1000;

export function validateGpsEvidence(
  value: GpsEvidence,
  now = new Date(),
): GpsEvidence {
  if (
    !Number.isFinite(value.latitude) ||
    !Number.isFinite(value.longitude) ||
    value.latitude < -90 ||
    value.latitude > 90 ||
    value.longitude < -180 ||
    value.longitude > 180
  ) {
    throw new Error("GPS coordinates are invalid.");
  }

  if (
    !Number.isFinite(value.accuracyMetres) ||
    value.accuracyMetres <= 0
  ) {
    throw new Error("GPS accuracy is invalid.");
  }

  const capturedAt = new Date(value.capturedAt);
  const age = now.getTime() - capturedAt.getTime();
  if (
    Number.isNaN(capturedAt.getTime()) ||
    age > MAX_GPS_AGE_MS ||
    age < -MAX_FUTURE_SKEW_MS
  ) {
    throw new Error("GPS reading is stale. Capture location again.");
  }

  return value;
}

export function captureFreshPosition(): Promise<GpsEvidence> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(
      new Error("This device does not provide browser location."),
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
          resolve(
            validateGpsEvidence({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracyMetres: position.coords.accuracy,
              capturedAt: new Date(position.timestamp).toISOString(),
            }),
          );
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission is required to record attendance."
            : error.code === error.TIMEOUT
              ? "Location timed out. Move to an open area and try again."
              : "Location is unavailable. Try again.";
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 12_000,
      },
    );
  });
}
