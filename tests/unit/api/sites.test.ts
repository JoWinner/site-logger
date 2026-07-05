import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/admin/sites/route";

const testState = vi.hoisted(() => ({
  insert: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireProfile: vi.fn().mockResolvedValue({
    profile: {
      id: "0e76edba-1bf3-487a-a66f-5c563dfe207c",
      role: "super_admin",
    },
    supabase: {
      from: () => ({
        insert: testState.insert,
      }),
    },
  }),
}));

describe("site creation route", () => {
  afterEach(() => {
    testState.insert.mockReset();
  });

  it("explains that every site needs a unique site code", async () => {
    testState.insert.mockResolvedValue({
      error: {
        code: "23505",
      },
    });

    const response = await POST(
      new Request("http://localhost/api/admin/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteCode: "atlas",
          name: "Another Atlas Site",
          isActive: true,
        }),
      }),
    );
    const result = await response.json();

    expect(response.status).toBe(409);
    expect(result.error).toBe(
      "Site code ATLAS is already in use. Enter a different code for each site.",
    );
  });
});
