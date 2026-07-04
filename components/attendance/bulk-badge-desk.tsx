"use client";

import QRCode from "qrcode";
import { useMemo, useState } from "react";

import { PrintableBadge } from "@/components/attendance/printable-badge";
import { bulkBadgePrintTitle } from "@/lib/qr/filenames";
import type { EmployeeRow } from "@/lib/database.types";

interface IssuedBadge {
  employeeId: string;
  employeeName: string;
  employeeIdPin: string | null;
  rawToken: string;
}

interface BadgePreview extends Omit<IssuedBadge, "rawToken"> {
  qrDataUrl: string;
}

export function BulkBadgeDesk({ employees }: { employees: EmployeeRow[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [badges, setBadges] = useState<BadgePreview[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter((employee) =>
      [
        employee.full_name,
        employee.employee_id_pin,
        employee.trade_role,
        employee.crew,
      ].some((value) => value?.toLowerCase().includes(term)),
    );
  }, [employees, query]);

  function toggleEmployee(employeeId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else if (next.size < 100) {
        next.add(employeeId);
      }
      return next;
    });
  }

  function selectFiltered() {
    const next = new Set(filtered.slice(0, 100).map((employee) => employee.id));
    setSelected(next);
    setMessage(
      filtered.length > 100
        ? "The first 100 filtered employees were selected."
        : null,
    );
  }

  async function issueSelected() {
    if (selected.size === 0) return;
    const confirmed = window.confirm(
      "Issuing these badges will revoke every selected employee's previous active badge. Continue?",
    );
    if (!confirmed) return;

    setPending(true);
    setMessage(null);
    setBadges([]);
    const response = await fetch("/api/super-admin/badges/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeIds: [...selected] }),
    });
    const result = (await response.json()) as {
      badges?: IssuedBadge[];
      error?: string;
    };
    if (!response.ok || !result.badges) {
      setMessage(result.error ?? "Badges could not be issued.");
      setPending(false);
      return;
    }

    const previews = await Promise.all(
      result.badges.map(async ({ rawToken, ...badge }) => ({
        ...badge,
        qrDataUrl: await QRCode.toDataURL(rawToken, {
          errorCorrectionLevel: "H",
          margin: 2,
          width: 620,
          color: { dark: "#14251f", light: "#fffef8" },
        }),
      })),
    );
    setBadges(previews);
    setPending(false);
  }

  function printBadges() {
    const previousTitle = document.title;
    document.title = bulkBadgePrintTitle();
    window.print();
    document.title = previousTitle;
  }

  return (
    <div className="bulk-badge-desk">
      <div className="bulk-badge-controls no-print">
        <label className="field">
          <span>Search employees</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, ID/PIN, trade or crew"
            type="search"
            value={query}
          />
        </label>
        <div className="bulk-badge-toolbar">
          <button className="button" onClick={selectFiltered} type="button">
            Select filtered
          </button>
          <button
            className="button"
            disabled={selected.size === 0}
            onClick={() => setSelected(new Set())}
            type="button"
          >
            Clear
          </button>
          <strong>{selected.size} selected</strong>
          <button
            aria-label={`Issue ${selected.size} ${selected.size === 1 ? "badge" : "badges"}`}
            className="button button--signal"
            disabled={selected.size === 0 || pending}
            onClick={issueSelected}
            type="button"
          >
            {pending ? "Issuing…" : `Issue ${selected.size} ${selected.size === 1 ? "badge" : "badges"}`}
          </button>
        </div>
        <div className="bulk-badge-list">
          {filtered.map((employee) => (
            <label className="bulk-badge-row" key={employee.id}>
              <input
                aria-label={`Select ${employee.full_name}`}
                checked={selected.has(employee.id)}
                onChange={() => toggleEmployee(employee.id)}
                type="checkbox"
              />
              <strong>{employee.full_name}</strong>
              <span>{employee.employee_id_pin ?? "No ID / PIN"}</span>
              <span>{employee.trade_role ?? "Role not set"}</span>
              <span>{employee.crew ?? "Crew not set"}</span>
            </label>
          ))}
          {filtered.length === 0 ? (
            <p className="empty-copy">No employees match this search.</p>
          ) : null}
        </div>
        {message ? <p className="form-note">{message}</p> : null}
      </div>

      {badges.length > 0 ? (
        <section className="bulk-badge-results">
          <header className="panel__header no-print">
            <div>
              <h2>Badges ready to print</h2>
              <span>Print before leaving this page.</span>
            </div>
            <button className="button button--signal" onClick={printBadges} type="button">
              Print badges
            </button>
          </header>
          <div className="bulk-badge-grid">
            {badges.map((badge) => (
              <PrintableBadge
                employeeIdPin={badge.employeeIdPin}
                employeeName={badge.employeeName}
                key={badge.employeeId}
                qrDataUrl={badge.qrDataUrl}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
