import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RoleNav } from "@/components/app-shell/role-nav";

const navigationState = vi.hoisted(() => ({
  pathname: "/admin",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
}));

describe("RoleNav", () => {
  beforeEach(() => {
    navigationState.pathname = "/admin";
  });

  it("marks the current page as active", () => {
    navigationState.pathname = "/admin/employees";

    render(<RoleNav role="admin" />);

    expect(
      screen.getByRole("link", { name: /employees/i }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: /overview/i }),
    ).not.toHaveAttribute("aria-current");
  });

  it("keeps a section active on its nested pages", () => {
    navigationState.pathname = "/admin/employees/employee-123/badge";

    render(<RoleNav role="admin" />);

    expect(
      screen.getByRole("link", { name: /employees/i }),
    ).toHaveClass("role-nav__link--active");
  });
});
