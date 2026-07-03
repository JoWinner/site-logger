import { describe, expect, it } from "vitest";

import { generateQrToken, hashQrToken } from "@/lib/qr/tokens";

describe("QR tokens", () => {
  it("generates opaque, non-repeating tokens and their hashes", () => {
    const first = generateQrToken();
    const second = generateQrToken();

    expect(first.rawToken).not.toBe(second.rawToken);
    expect(first.rawToken).not.toContain("employee");
    expect(first.rawToken.length).toBeGreaterThanOrEqual(40);
    expect(first.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(first.tokenHash).toBe(hashQrToken(first.rawToken));
  });

  it("hashes the same token deterministically", () => {
    expect(hashQrToken("sample-token-that-is-long-enough")).toBe(
      hashQrToken("sample-token-that-is-long-enough"),
    );
  });
});
