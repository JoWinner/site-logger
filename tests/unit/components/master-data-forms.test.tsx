import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EmployeeForm } from "@/app/(protected)/admin/employees/employee-form";
import { SiteForm } from "@/app/(protected)/admin/sites/site-form";

const routerState = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerState,
}));

describe("master data forms", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    routerState.refresh.mockReset();
  });

  it("resets a new employee form after saving", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    render(<EmployeeForm sites={[]} />);

    fireEvent.change(screen.getByLabelText("Employee name *"), {
      target: { value: "New Worker" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Add employee" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Employee saved.")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Employee name *")).toHaveValue("");
  });

  it("resets a new site form after saving", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    render(<SiteForm />);

    expect(
      screen.getByText(
        "Each site needs a different code, for example ATLAS or POKUASE.",
      ),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Permanent site code *"), {
      target: { value: "SITE-01" },
    });
    fireEvent.change(screen.getByLabelText("Site name *"), {
      target: { value: "Pokuase Station" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Add site" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Site saved.")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Permanent site code *")).toHaveValue("");
    expect(screen.getByLabelText("Site name *")).toHaveValue("");
  });
});
