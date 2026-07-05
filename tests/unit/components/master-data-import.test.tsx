import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MasterDataImport } from "@/components/imports/master-data-import";

const routerState = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerState,
}));

describe("MasterDataImport", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    routerState.refresh.mockReset();
  });

  it("previews and commits valid employee rows", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            rows: [
              {
                rowNumber: 2,
                disposition: "new",
                value: {
                  fullName: "Marcus Hill",
                  employeeIdPin: "E001",
                  tradeRole: null,
                  currentSiteId: null,
                  isActive: true,
                },
                messages: [],
              },
            ],
            summary: { total: 1, new: 1, update: 0, warning: 0, error: 0 },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ created: 1, updated: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<MasterDataImport entity="employees" />);

    const file = new File(["Employee Name\nMarcus Hill"], "employees.csv", {
      type: "text/csv",
    });
    fireEvent.change(screen.getByLabelText("Employee file"), {
      target: { files: [file] },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Preview import" }).closest("form")!,
    );

    expect(await screen.findByText("Marcus Hill")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Import 1 rows" }));

    await waitFor(() => {
      expect(
        screen.getByText("Import complete: 1 created, 0 updated."),
      ).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(routerState.refresh).toHaveBeenCalledOnce();
  });
});
