import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/app/(auth)/login/login-form";
import { UserForm } from "@/app/(protected)/super-admin/users/user-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

describe("password visibility", () => {
  it("toggles the login password without changing its value", () => {
    render(<LoginForm />);

    const password = screen.getByLabelText("Password");
    fireEvent.change(password, { target: { value: "private-password" } });

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));

    expect(password).toHaveAttribute("type", "text");
    expect(password).toHaveValue("private-password");
    expect(
      screen.getByRole("button", { name: "Hide password" }),
    ).toBeInTheDocument();
  });

  it("toggles the new-user password", () => {
    render(<UserForm />);

    const password = screen.getByLabelText("Initial password *");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));

    expect(password).toHaveAttribute("type", "text");
  });
});
