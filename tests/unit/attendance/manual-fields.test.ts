import { describe, expect, it } from "vitest";

import { manualFieldsSchema } from "@/lib/validation/manual-fields";

describe("manualFieldsSchema", () => {
  it("preserves null separately from false", () => {
    expect(
      manualFieldsSchema.parse({
        overtimeCheck: null,
        assignmentCheck: false,
        payrollStatus: null,
        notes: "",
      }),
    ).toEqual({
      overtimeCheck: null,
      assignmentCheck: false,
      payrollStatus: null,
      notes: null,
    });
  });

  it("accepts only the manual payroll statuses", () => {
    expect(
      manualFieldsSchema.parse({
        overtimeCheck: true,
        assignmentCheck: true,
        payrollStatus: "on_hold",
        notes: "Supervisor review.",
      }).payrollStatus,
    ).toBe("on_hold");

    expect(() =>
      manualFieldsSchema.parse({
        overtimeCheck: null,
        assignmentCheck: null,
        payrollStatus: "automatically_paid",
        notes: null,
      }),
    ).toThrow();
  });

  it("limits notes to 1000 characters", () => {
    expect(() =>
      manualFieldsSchema.parse({
        overtimeCheck: null,
        assignmentCheck: null,
        payrollStatus: null,
        notes: "x".repeat(1001),
      }),
    ).toThrow();
  });
});
