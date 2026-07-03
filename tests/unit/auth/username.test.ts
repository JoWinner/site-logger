import { describe, expect, it } from "vitest";

import {
  normalizeUsername,
  usernameToInternalEmail,
} from "@/lib/auth/username";

describe("normalizeUsername", () => {
  it("normalizes a human-entered username", () => {
    expect(normalizeUsername(" Site Keeper ")).toBe("sitekeeper");
  });

  it("rejects unsupported characters", () => {
    expect(() => normalizeUsername("site@keeper")).toThrow(
      "Username may contain only letters, numbers, dots, dashes, and underscores.",
    );
  });

  it("requires at least three characters", () => {
    expect(() => normalizeUsername("ab")).toThrow(
      "Username must be between 3 and 32 characters.",
    );
  });
});

describe("usernameToInternalEmail", () => {
  it("derives a private Supabase Auth identifier", () => {
    expect(usernameToInternalEmail("Site Keeper")).toBe(
      "sitekeeper@site-logger.local",
    );
  });
});
