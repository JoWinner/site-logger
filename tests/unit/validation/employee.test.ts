import { describe, expect, it } from "vitest";

import { employeeInputSchema } from "@/lib/validation/employee";

describe("employeeInputSchema", () => {
  it("accepts an employee without an ID or PIN", () => {
    const result = employeeInputSchema.parse({
      fullName: "Ama Mensah",
      employeeIdPin: "",
      tradeRole: "Carpenter",
      crew: "Crew A",
      isActive: true,
    });

    expect(result.employeeIdPin).toBeNull();
  });

  it("normalizes a supplied ID without making it mandatory", () => {
    const result = employeeInputSchema.parse({
      fullName: "  Kojo Boateng  ",
      employeeIdPin: " emp-19 ",
      tradeRole: "",
      crew: "",
      isActive: true,
    });

    expect(result).toMatchObject({
      fullName: "Kojo Boateng",
      employeeIdPin: "EMP-19",
      tradeRole: null,
      crew: null,
    });
  });

  it("rejects a blank employee name", () => {
    expect(() =>
      employeeInputSchema.parse({
        fullName: "  ",
        employeeIdPin: "",
        isActive: true,
      }),
    ).toThrow();
  });
});
