"use client";

import { useMemo, useState } from "react";

import type { SiteRow } from "@/lib/database.types";

export function ExportControls({
  sites,
  assignedSite = null,
}: {
  sites: SiteRow[];
  assignedSite?: SiteRow | null;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(assignedSite ? [assignedSite.id] : []),
  );
  const invalidRange = Boolean(from && to && from > to);
  const ready = Boolean(from && to && !invalidRange && selected.size);
  const query = useMemo(() => {
    const params = new URLSearchParams({ from, to });
    for (const siteId of selected) params.append("site", siteId);
    return params.toString();
  }, [from, selected, to]);

  function toggleSite(siteId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(siteId)) next.delete(siteId);
      else next.add(siteId);
      return next;
    });
  }

  return (
    <section className="export-controls" aria-label="Attendance export">
      <div className="panel__header">
        <div>
          <h2>Export attendance</h2>
          <span>Select a date range before downloading.</span>
        </div>
      </div>
      <div className="export-controls__fields">
        <label className="field">
          <span>From *</span>
          <input onChange={(event) => setFrom(event.target.value)} required type="date" value={from} />
        </label>
        <label className="field">
          <span>To *</span>
          <input onChange={(event) => setTo(event.target.value)} required type="date" value={to} />
        </label>
      </div>
      {assignedSite ? (
        <p className="export-controls__locked-site">
          Assigned site: <strong>{assignedSite.name}</strong>
        </p>
      ) : (
        <fieldset className="export-site-picker">
          <legend>Sites *</legend>
          {sites.map((site) => (
            <label className="check-field" key={site.id}>
              <input
                checked={selected.has(site.id)}
                onChange={() => toggleSite(site.id)}
                type="checkbox"
              />
              <span>{site.name}</span>
            </label>
          ))}
        </fieldset>
      )}
      {invalidRange ? (
        <p className="form-note">The To date must be on or after the From date.</p>
      ) : null}
      <div className="form-actions">
        {ready ? (
          <>
            <a className="button button--signal" href={`/api/exports/attendance.csv?${query}`}>
              Download CSV
            </a>
            <a className="button button--signal" href={`/api/exports/attendance.xlsx?${query}`}>
              Download XLSX
            </a>
          </>
        ) : (
          <span className="form-note">Choose dates and at least one site.</span>
        )}
      </div>
    </section>
  );
}
