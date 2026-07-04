import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteLedger } from "@/components/admin/site-ledger";
import type { SiteRow } from "@/lib/database.types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

const site: SiteRow = {
  id: "site-1",
  site_code: "ATLAS",
  name: "Atlas",
  is_active: true,
  created_by: null,
  updated_by: null,
  created_at: "2026-07-01T10:00:00.000Z",
  updated_at: "2026-07-03T10:00:00.000Z",
};

describe("SiteLedger", () => {
  it("renders the site table with edit actions", () => {
    render(<SiteLedger sites={[site]} />);

    expect(
      screen.getByRole("table", { name: "Site ledger" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Atlas")).toBeInTheDocument();
    expect(screen.getByText("ATLAS")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit Atlas" }),
    ).toBeInTheDocument();
  });

  it("opens the site editor from the row", () => {
    render(<SiteLedger sites={[site]} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Atlas" }));

    expect(
      screen.getByRole("dialog", { name: "Edit Atlas" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Site name *")).toHaveValue("Atlas");
  });
});
