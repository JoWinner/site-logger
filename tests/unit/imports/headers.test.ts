import { describe, expect, it } from "vitest";

import {
  getCanonicalHeader,
  normalizeHeader,
} from "@/lib/imports/headers";

describe("import headers", () => {
  it("normalizes punctuation and common employee aliases", () => {
    expect(normalizeHeader(" Employee-ID / PIN ")).toBe("employeeidpin");
    expect(getCanonicalHeader("employees", "Employee ID / PIN")).toBe(
      "employeeIdPin",
    );
    expect(getCanonicalHeader("employees", "Worker Name")).toBe("fullName");
    expect(getCanonicalHeader("employees", "Trade / Role")).toBe("tradeRole");
  });

  it("normalizes common site aliases", () => {
    expect(getCanonicalHeader("sites", "Job Site Code")).toBe("siteCode");
    expect(getCanonicalHeader("sites", "Site Name")).toBe("name");
    expect(getCanonicalHeader("sites", "Is Active")).toBe("isActive");
  });
});
