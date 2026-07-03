import { describe, expect, it } from "vitest";

import { getScanErrorMessage } from "@/lib/attendance/scan-errors";

describe("scan error messages", () => {
  it("gives operators a specific action for missing GPS", () => {
    expect(getScanErrorMessage("gps_required")).toContain("location");
  });

  it("explains attendance state errors without technical details", () => {
    expect(getScanErrorMessage("already_checked_in")).toContain(
      "already checked in",
    );
    expect(getScanErrorMessage("no_open_session")).toContain("open check-in");
  });

  it("uses a safe fallback for unknown infrastructure errors", () => {
    expect(getScanErrorMessage("unexpected_database_detail")).toBe(
      "The scan could not be recorded. Try again.",
    );
  });
});
