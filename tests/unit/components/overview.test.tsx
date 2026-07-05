import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteOverviewGrid } from "@/components/admin/site-overview-grid";

describe("SiteOverviewGrid", () => {
  it("groups active employees and Timekeepers by site", () => {
    render(
      <SiteOverviewGrid
        groups={[
          {
            key: "atlas",
            name: "Atlas",
            siteCode: "ATLAS",
            activeEmployees: 2,
            sessionsToday: 1,
            timekeepers: ["Frank"],
          },
          {
            key: "unassigned",
            name: "Unassigned",
            siteCode: null,
            activeEmployees: 2,
            sessionsToday: 0,
            timekeepers: [],
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Atlas" })).toBeInTheDocument();
    expect(screen.getByText("Frank")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Unassigned" })).toBeInTheDocument();
  });
});
