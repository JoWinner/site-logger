"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

interface ExistingEmployee {
  id: string;
  fullName: string;
  employeeIdPin: string | null;
  tradeRole: string | null;
  crew: string | null;
  isActive: boolean;
}

export function EmployeeForm({
  employee,
  compact = false,
}: {
  employee?: ExistingEmployee;
  compact?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);

    const response = await fetch(
      employee ? `/api/admin/employees/${employee.id}` : "/api/admin/employees",
      {
        method: employee ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.get("fullName"),
          employeeIdPin: form.get("employeeIdPin"),
          tradeRole: form.get("tradeRole"),
          crew: form.get("crew"),
          isActive: form.get("isActive") === "on",
        }),
      },
    );
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(result.error ?? "Employee could not be saved.");
      setPending(false);
      return;
    }

    if (!employee) event.currentTarget.reset();
    setMessage("Employee saved.");
    setPending(false);
    router.refresh();
  }

  return (
    <form className={compact ? "record-form record-form--compact" : "record-form"} onSubmit={submit}>
      <label className="field">
        <span>Employee name *</span>
        <input defaultValue={employee?.fullName} name="fullName" required />
      </label>
      <label className="field">
        <span>Employee ID / PIN (optional)</span>
        <input defaultValue={employee?.employeeIdPin ?? ""} name="employeeIdPin" />
      </label>
      <label className="field">
        <span>Trade / role</span>
        <input defaultValue={employee?.tradeRole ?? ""} name="tradeRole" />
      </label>
      <label className="field">
        <span>Crew</span>
        <input defaultValue={employee?.crew ?? ""} name="crew" />
      </label>
      <label className="check-field">
        <input defaultChecked={employee?.isActive ?? true} name="isActive" type="checkbox" />
        <span>Active employee</span>
      </label>
      <div className="form-actions">
        <button className="button" disabled={pending} type="submit">
          {pending ? "Saving…" : employee ? "Update employee" : "Add employee"}
        </button>
        {message ? <span className="form-note">{message}</span> : null}
      </div>
    </form>
  );
}
