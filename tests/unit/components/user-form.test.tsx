import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserForm } from "@/app/(protected)/super-admin/users/user-form";
import type { SiteRow } from "@/lib/database.types";

const routerState = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerState,
}));

const sites: SiteRow[] = [
  {
    id: "40eb6ccb-b455-479e-83f4-d88f2fd7ecb2",
    site_code: "ATLAS",
    name: "Atlas",
    is_active: true,
    created_by: null,
    updated_by: null,
    created_at: "2026-07-05T00:00:00.000Z",
    updated_at: "2026-07-05T00:00:00.000Z",
  },
];

describe("UserForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    routerState.refresh.mockReset();
  });

  it("resets the create form after a successful save", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<UserForm sites={sites} />);

    fireEvent.change(screen.getByLabelText("Username *"), {
      target: { value: "foreman" },
    });
    fireEvent.change(screen.getByLabelText("Display name *"), {
      target: { value: "Site Foreman" },
    });
    fireEvent.change(screen.getByLabelText("Initial password *"), {
      target: { value: "long-password" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Create user" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("User saved.")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Username *")).toHaveValue("");
    expect(screen.getByLabelText("Display name *")).toHaveValue("");
    expect(routerState.refresh).toHaveBeenCalledOnce();
  });

  it("requires a site only while the Timekeeper role is selected", () => {
    render(<UserForm sites={sites} />);

    const site = screen.getByLabelText("Assigned site *");
    expect(site).toBeRequired();

    fireEvent.change(screen.getByLabelText("Role *"), {
      target: { value: "admin" },
    });

    expect(screen.queryByLabelText("Assigned site *")).not.toBeInTheDocument();
  });

  it("lets a Super Admin update an existing user's username", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <UserForm
        sites={sites}
        user={{
          id: "user-id",
          username: "old.foreman",
          displayName: "Old Foreman",
          role: "admin",
          assignedSiteId: null,
          isActive: true,
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Username *"), {
      target: { value: "new.foreman" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Update user" }).closest("form")!,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      username: "new.foreman",
      displayName: "Old Foreman",
    });
  });
});
