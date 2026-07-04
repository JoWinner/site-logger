import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/super-admin/badges/bulk/route";

const employeeId = "1edc3fc0-06d8-4d8c-965b-a5547a341bf6";

const testState = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireProfile: vi.fn().mockResolvedValue({
    profile: {
      id: "0e76edba-1bf3-487a-a66f-5c563dfe207c",
      role: "super_admin",
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: () => ({
    from: testState.from,
    rpc: testState.rpc,
  }),
}));

vi.mock("@/lib/qr/tokens", () => ({
  generateQrToken: () => ({
    rawToken: "raw-token",
    tokenHash: "a".repeat(64),
  }),
}));

describe("bulk badge route", () => {
  afterEach(() => {
    testState.from.mockReset();
    testState.rpc.mockReset();
  });

  it("sends only hashes to the transaction and returns raw tokens once", async () => {
    const query = {
      select: vi.fn(() => query),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            id: employeeId,
            full_name: "Marcus Hill",
            employee_id_pin: "E001",
            is_active: true,
          },
        ],
        error: null,
      }),
    };
    testState.from.mockReturnValue(query);
    testState.rpc.mockResolvedValue({ data: { issued: 1 }, error: null });

    const response = await POST(
      new Request("http://localhost/api/super-admin/badges/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeIds: [employeeId] }),
      }),
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(testState.rpc).toHaveBeenCalledWith(
      "issue_bulk_qr_badges",
      expect.objectContaining({
        p_employee_ids: [employeeId],
        p_token_hashes: ["a".repeat(64)],
      }),
    );
    expect(JSON.stringify(testState.rpc.mock.calls)).not.toContain("raw-token");
    expect(result.badges[0]).toMatchObject({
      employeeName: "Marcus Hill",
      rawToken: "raw-token",
    });
  });
});
