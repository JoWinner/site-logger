"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import type { AttendanceSessionRow } from "@/lib/database.types";

function localValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function CorrectionForm({ session }: { session: AttendanceSessionRow }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/attendance/${session.id}/corrections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkInAt: new Date(String(form.get("checkInAt"))).toISOString(),
        checkOutAt: form.get("checkOutAt")
          ? new Date(String(form.get("checkOutAt"))).toISOString()
          : null,
        reason: form.get("reason"),
      }),
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Correction recorded." : result.error ?? "Correction failed.");
    if (response.ok) router.refresh();
  }

  return (
    <form className="record-form" onSubmit={submit}>
      <label className="field"><span>Corrected check in</span><input defaultValue={localValue(session.check_in_at)} name="checkInAt" type="datetime-local" required /></label>
      <label className="field"><span>Corrected check out</span><input defaultValue={localValue(session.check_out_at)} disabled={!session.check_out_at} name="checkOutAt" type="datetime-local" /></label>
      <label className="field"><span>Reason *</span><textarea minLength={3} maxLength={500} name="reason" required rows={3} /></label>
      <div className="form-actions"><button className="button button--signal" type="submit">Record correction</button>{message ? <span className="form-note">{message}</span> : null}</div>
    </form>
  );
}
