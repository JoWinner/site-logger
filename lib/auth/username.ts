const USERNAME_PATTERN = /^[a-z0-9._-]+$/;
const INTERNAL_AUTH_DOMAIN = "site-logger.local";

export function normalizeUsername(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "");

  if (normalized.length < 3 || normalized.length > 32) {
    throw new Error("Username must be between 3 and 32 characters.");
  }

  if (!USERNAME_PATTERN.test(normalized)) {
    throw new Error(
      "Username may contain only letters, numbers, dots, dashes, and underscores.",
    );
  }

  return normalized;
}

export function usernameToInternalEmail(username: string): string {
  return `${normalizeUsername(username)}@${INTERNAL_AUTH_DOMAIN}`;
}
