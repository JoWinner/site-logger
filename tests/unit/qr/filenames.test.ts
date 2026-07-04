import { describe, expect, it } from "vitest";

import { badgePrintTitle, bulkBadgePrintTitle } from "@/lib/qr/filenames";

describe("badge print titles", () => {
  it("uses the employee name and removes filename-unsafe characters", () => {
    expect(badgePrintTitle('Ama / Mensah: "Foreman"')).toBe(
      "Ama Mensah Foreman - QR Badge",
    );
  });

  it("names a bulk print job with its date", () => {
    expect(bulkBadgePrintTitle(new Date("2026-07-04T10:00:00.000Z"))).toBe(
      "Employee QR Badges - 2026-07-04",
    );
  });
});
