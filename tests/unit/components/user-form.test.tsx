import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserForm } from "@/app/(protected)/super-admin/users/user-form";

const routerState = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerState,
}));

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

    render(<UserForm />);

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
});
