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

export function RecentScansTable({
  rows,
  role,
}: {
  rows: AttendanceLedgerRow[];
  role: AppRole;
}) {
  const [selected, setSelected] = useState<AttendanceLedgerRow | null>(null);

  if (rows.length === 0) {
    return <p className="empty-copy">No attendance sessions yet.</p>;
  }

  return (
    <>
      <div className="recent-scans-table-wrap">
        <table className="recent-scans-table">
          <caption>Recent scans</caption>
          <thead>
            <tr>
              <th scope="col">Employee</th>
              <th scope="col">Time</th>
              <th scope="col">Status</th>
              <th scope="col">View</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
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
                <td>
                  <strong>{row.employee_name_snapshot}</strong>
                  <time dateTime={row.work_date}>{row.work_date}</time>
                </td>
                <td>
                  <span className="recent-scans-table__time">
                    {shortTime(row.check_in_at)}
                    <span aria-hidden="true">–</span>
                    {shortTime(row.check_out_at)}
                  </span>
                </td>
                <td>
                  <span className={`ledger-status ledger-status--${row.status}`}>
                    {row.status}
                  </span>
                </td>
                <td>
                  <button
                    aria-label={`Open recent scan for ${row.employee_name_snapshot}`}
                    className="button recent-scans-table__view"
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
      <AttendancePreviewDialog
        onClose={() => setSelected(null)}
        open={selected !== null}
        role={role}
        session={selected}
      />
    </>
  );
}
