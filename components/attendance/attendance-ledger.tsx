"use client";

import { useState } from "react";

import { AttendancePreviewDialog } from "@/components/attendance/attendance-preview-dialog";
import type { AttendanceLedgerRow } from "@/lib/attendance/ledger";
import type { AppRole } from "@/lib/database.types";

function shortTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timekeeperLabel(name: string | null, id: string | null): string {
  if (!id) return "—";
  return `${name ? `${name} · ` : ""}${id.slice(0, 8)}…`;
}

function overtimeLabel(value: boolean | null): string {
  if (value === null) return "Not set";
  return value ? "Yes" : "No";
}

export function AttendanceLedger({
  rows,
  role,
  displayMode = "responsive",
}: {
  rows: AttendanceLedgerRow[];
  role: AppRole;
  displayMode?: "responsive" | "paginated-table";
}) {
  const [selected, setSelected] = useState<AttendanceLedgerRow | null>(null);
  const [page, setPage] = useState(1);
  const isPaginatedTable = displayMode === "paginated-table";
  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = isPaginatedTable
    ? rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : rows;

  if (rows.length === 0) {
    return <p className="empty-copy">No attendance sessions yet.</p>;
  }

  return (
    <>
      <div
        className={`responsive-table-wrap attendance-ledger-wrap${
          isPaginatedTable ? " attendance-ledger-wrap--desktop" : ""
        }`}
      >
        <table
          className={`responsive-table attendance-ledger${
            isPaginatedTable ? " attendance-ledger--desktop" : ""
          }`}
        >
          <caption>Attendance ledger</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Employee</th>
              <th scope="col">Site</th>
              <th scope="col">Check in</th>
              <th scope="col">Check out</th>
              <th scope="col">Hours</th>
              <th scope="col">Check in by</th>
              <th scope="col">Check out by</th>
              <th scope="col">Overtime</th>
              <th scope="col">Status</th>
              <th scope="col">Preview</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr
                className="attendance-ledger__row"
                key={row.id}
                onClick={() => setSelected(row)}
                onKeyDown={(event) => {
                  if (
                    event.target === event.currentTarget
                    && (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    setSelected(row);
                  }
                }}
                tabIndex={0}
              >
                <td data-label="Date">{row.work_date}</td>
                <td data-label="Employee"><strong>{row.employee_name_snapshot}</strong></td>
                <td data-label="Site">{row.site_name_snapshot}</td>
                <td data-label="Check in">{shortTime(row.check_in_at)}</td>
                <td data-label="Check out">{shortTime(row.check_out_at)}</td>
                <td data-label="Hours">
                  {row.worked_minutes === null
                    ? "—"
                    : (row.worked_minutes / 60).toFixed(2)}
                </td>
                <td data-label="Check in by">
                  {timekeeperLabel(row.checkInTimekeeperName, row.check_in_by)}
                </td>
                <td data-label="Check out by">
                  {timekeeperLabel(row.checkOutTimekeeperName, row.check_out_by)}
                </td>
                <td data-label="Overtime">
                  {overtimeLabel(row.overtime_check)}
                </td>
                <td data-label="Status">
                  <span className={`ledger-status ledger-status--${row.status}`}>
                    {row.status}
                  </span>
                </td>
                <td data-label="Preview">
                  <button
                    aria-label={`Open attendance preview for ${row.employee_name_snapshot}`}
                    className="button button--compact"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelected(row);
                    }}
                    type="button"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isPaginatedTable && pageCount > 1 ? (
        <nav aria-label="Attendance table pagination" className="pagination">
          <button
            className="button button--compact"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
            type="button"
          >
            Previous
          </button>
          <span>Page {currentPage} of {pageCount}</span>
          <button
            aria-label="Next page"
            className="button button--compact"
            disabled={currentPage === pageCount}
            onClick={() => setPage(currentPage + 1)}
            type="button"
          >
            Next
          </button>
        </nav>
      ) : null}
      <AttendancePreviewDialog
        onClose={() => setSelected(null)}
        open={selected !== null}
        role={role}
        session={selected}
      />
    </>
  );
}
