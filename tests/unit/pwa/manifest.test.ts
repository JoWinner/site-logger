import { describe, expect, it } from "vitest";

import manifest from "@/app/manifest";

describe("PWA manifest", () => {
  it("is installable with standalone display and required icons", () => {
    const value = manifest();
    expect(value.name).toBe("Site Logger Attendance");
    expect(value.display).toBe("standalone");
    expect(value.start_url).toBe("/login");
    expect(value.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: "192x192" }),
        expect.objectContaining({ sizes: "512x512" }),
      ]),
    );
  });
});
