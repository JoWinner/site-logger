import { describe, expect, it } from "vitest";

import { siteInputSchema } from "@/lib/validation/site";

describe("siteInputSchema", () => {
  it("normalizes a permanent site code", () => {
    expect(
      siteInputSchema.parse({
        siteCode: " atlas-01 ",
        name: " Atlas ",
        isActive: true,
      }),
    ).toEqual({
      siteCode: "ATLAS-01",
      name: "Atlas",
      isActive: true,
    });
  });

  it("requires a site name and a permanent code", () => {
    expect(() =>
      siteInputSchema.parse({
        siteCode: "",
        name: "",
        isActive: true,
      }),
    ).toThrow();
  });
});
