"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import type { AttendanceSessionRow } from "@/lib/database.types";

function toBooleanOrNull(value: FormDataEntryValue | null) {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

export function ManualFieldsForm({ session }: { session: AttendanceSessionRow }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/attendance/${session.id}/manual-fields`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overtimeCheck: toBooleanOrNull(form.get("overtimeCheck")),
        assignmentCheck: toBooleanOrNull(form.get("assignmentCheck")),
        payrollStatus: form.get("payrollStatus") || null,
        notes: form.get("notes"),
      }),
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Manual review saved." : result.error ?? "Review could not be saved.");
    setPending(false);
    if (response.ok) router.refresh();
  }

  const triValue = (value: boolean | null) =>
    value === null ? "" : value ? "yes" : "no";

  return (
    <form className="record-form" onSubmit={submit}>
      <label className="field">
        <span>Overtime check</span>
        <select defaultValue={triValue(session.overtime_check)} name="overtimeCheck">
          <option value="">Not entered</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </label>
      <label className="field">
        <span>Assignment check</span>
        <select defaultValue={triValue(session.assignment_check)} name="assignmentCheck">
          <option value="">Not entered</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </label>
      <label className="field">
        <span>Payroll status</span>
        <select defaultValue={session.payroll_status ?? ""} name="payrollStatus">
          <option value="">Not entered</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="on_hold">On hold</option>
          <option value="paid">Paid</option>
        </select>
      </label>
      <label className="field">
        <span>Notes</span>
        <textarea defaultValue={session.notes ?? ""} maxLength={1000} name="notes" rows={4} />
      </label>
      <div className="form-actions">
        <button className="button" disabled={pending} type="submit">{pending ? "Saving…" : "Save manual review"}</button>
        {message ? <span className="form-note">{message}</span> : null}
      </div>
    </form>
  );
}
