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

function timekeeperLabel(row: AttendanceLedgerRow): string {
  return `${row.checkInTimekeeperName ? `${row.checkInTimekeeperName} · ` : ""}${row.check_in_by.slice(0, 8)}…`;
}

export function AttendanceLedger({
  rows,
  role,
  mapAvailable = false,
}: {
  rows: AttendanceLedgerRow[];
  role: AppRole;
  mapAvailable?: boolean;
}) {
  const [selected, setSelected] = useState<AttendanceLedgerRow | null>(null);

  if (rows.length === 0) {
    return <p className="empty-copy">No attendance sessions yet.</p>;
  }

  return (
    <>
      <div className="responsive-table-wrap attendance-ledger-wrap">
        <table className="responsive-table attendance-ledger">
          <caption>Attendance ledger</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Employee</th>
              <th scope="col">Site</th>
              <th scope="col">GPS location</th>
              <th scope="col">Time</th>
              <th scope="col">Hours</th>
              <th scope="col">Timekeeper</th>
              <th scope="col">Status</th>
              <th scope="col">Preview</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                className="attendance-ledger__row"
                key={row.id}
                onClick={() => setSelected(row)}
                onKeyDown={(event) => {
                  if (
                    event.target === event.currentTarget &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    setSelected(row);
                  }
                }}
                tabIndex={0}
              >
                <td data-label="Date">{row.work_date}</td>
                <td data-label="Employee">
                  <strong>{row.employee_name_snapshot}</strong>
                  <small>{row.employee_id_pin_snapshot ?? "No ID / PIN"}</small>
                </td>
                <td data-label="Site">{row.site_name_snapshot}</td>
                <td data-label="GPS location">
                  {row.checkInLocationLabel ?? "Name unavailable"}
                </td>
                <td data-label="Time">
                  {shortTime(row.check_in_at)}–{shortTime(row.check_out_at)}
                </td>
                <td data-label="Hours">
                  {row.worked_minutes === null
                    ? "—"
                    : (row.worked_minutes / 60).toFixed(2)}
                </td>
                <td data-label="Timekeeper">{timekeeperLabel(row)}</td>
                <td data-label="Status">
                  <span
                    className={`ledger-status ledger-status--${row.status}`}
                  >
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
      <AttendancePreviewDialog
        mapAvailable={mapAvailable}
        onClose={() => setSelected(null)}
        open={selected !== null}
        role={role}
        session={selected}
      />
    </>
  );
}
