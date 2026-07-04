"use client";

import Link from "next/link";

import { CorrectionForm } from "@/components/attendance/correction-form";
import { LocationEvidence } from "@/components/attendance/location-evidence";
import { ManualFieldsForm } from "@/components/attendance/manual-fields-form";
import { RecordDialog } from "@/components/data/record-dialog";
import type { AttendanceLedgerRow } from "@/lib/attendance/ledger";
import type { AppRole } from "@/lib/database.types";

function timekeeperLabel(name: string | null, id: string | null): string {
  if (!id) return "Not checked out";
  return `${name ? `${name} · ` : ""}${id.slice(0, 8)}…`;
}

export function AttendancePreviewDialog({
  session,
  role,
  open,
  mapAvailable,
  onClose,
}: {
  session: AttendanceLedgerRow | null;
  role: AppRole;
  open: boolean;
  mapAvailable: boolean;
  onClose: () => void;
}) {
  const isAdmin = role === "admin" || role === "super_admin";
  const title = session
    ? `${session.employee_name_snapshot} attendance`
    : "Attendance preview";

  return (
    <RecordDialog onClose={onClose} open={open} title={title}>
      {session ? (
        <div className="attendance-preview">
          <div className="attendance-preview__summary">
            <div>
              <span>Site</span>
              <strong>{session.site_name_snapshot}</strong>
            </div>
            <div>
              <span>Work date</span>
              <strong>{session.work_date}</strong>
            </div>
            <div>
              <span>Hours</span>
              <strong>
                {session.worked_minutes === null
                  ? "Open"
                  : (session.worked_minutes / 60).toFixed(2)}
              </strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{session.status}</strong>
            </div>
          </div>

          <section className="attendance-preview__section">
            <h3>Check in</h3>
            <p>{new Date(session.check_in_at).toLocaleString()}</p>
            <p>
              Timekeeper:{" "}
              {timekeeperLabel(
                session.checkInTimekeeperName,
                session.check_in_by,
              )}
            </p>
            <LocationEvidence
              accuracyMetres={session.check_in_accuracy_metres}
              label={session.checkInLocationLabel}
              latitude={session.check_in_latitude}
              longitude={session.check_in_longitude}
              mapAvailable={mapAvailable}
            />
          </section>

          <section className="attendance-preview__section">
            <h3>Check out</h3>
            <p>
              {session.check_out_at
                ? new Date(session.check_out_at).toLocaleString()
                : "Open session"}
            </p>
            <p>
              Timekeeper:{" "}
              {timekeeperLabel(
                session.checkOutTimekeeperName,
                session.check_out_by,
              )}
            </p>
            <LocationEvidence
              accuracyMetres={session.check_out_accuracy_metres}
              label={session.checkOutLocationLabel}
              latitude={session.check_out_latitude}
              longitude={session.check_out_longitude}
              mapAvailable={mapAvailable}
            />
          </section>

          <section className="attendance-preview__section">
            <h3>Manual review</h3>
            <ManualFieldsForm session={session} />
          </section>

          {isAdmin ? (
            <section className="attendance-preview__section">
              <h3>Correct display times</h3>
              <p className="form-note">
                Original QR scan events remain unchanged.
              </p>
              <CorrectionForm session={session} />
            </section>
          ) : null}

          <div className="attendance-preview__footer">
            <Link
              className="button button--signal"
              href={`/attendance/${session.id}`}
            >
              Open full attendance page
            </Link>
          </div>
        </div>
      ) : null}
    </RecordDialog>
  );
}
