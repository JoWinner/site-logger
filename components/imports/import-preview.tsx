"use client";

import { useMemo, useState } from "react";

import type {
  ImportPreview,
  ImportValue,
} from "@/lib/imports/types";

function recordLabel(value: ImportValue | null): string {
  if (!value) return "Invalid row";
  if ("fullName" in value) return value.fullName;
  return `${value.siteCode} · ${value.name}`;
}

export function ImportPreviewTable({
  preview,
}: {
  preview: ImportPreview<ImportValue>;
}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("all");
  const [sort, setSort] = useState("row");
  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return preview.rows
      .filter(
        (row) =>
          (result === "all" || row.disposition === result)
          && (!term
            || recordLabel(row.value).toLowerCase().includes(term)
            || row.messages.join(" ").toLowerCase().includes(term)),
      )
      .sort((a, b) => {
        if (sort === "record") {
          return recordLabel(a.value).localeCompare(recordLabel(b.value));
        }
        if (sort === "result") {
          return a.disposition.localeCompare(b.disposition);
        }
        return a.rowNumber - b.rowNumber;
      });
  }, [preview.rows, query, result, sort]);

  return (
    <div className="import-preview">
      <div className="import-summary" aria-label="Import summary">
        <span>
          <strong>{preview.summary.new}</strong> new
        </span>
        <span>
          <strong>{preview.summary.update}</strong> updates
        </span>
        <span>
          <strong>{preview.summary.warning}</strong> warnings
        </span>
        <span>
          <strong>{preview.summary.error}</strong> errors
        </span>
      </div>
      <div className="ledger-toolbar import-preview__toolbar">
        <label className="field">
          <span>Search preview</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            value={query}
          />
        </label>
        <label className="field">
          <span>Result</span>
          <select onChange={(event) => setResult(event.target.value)} value={result}>
            <option value="all">All results</option>
            <option value="new">New</option>
            <option value="update">Update</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </label>
        <label className="field">
          <span>Sort</span>
          <select onChange={(event) => setSort(event.target.value)} value={sort}>
            <option value="row">Source row</option>
            <option value="record">Record name</option>
            <option value="result">Result</option>
          </select>
        </label>
      </div>
      <div className="responsive-table-wrap">
        <table className="responsive-table import-preview__table">
          <caption>Import preview</caption>
          <thead>
            <tr>
              <th scope="col">Row</th>
              <th scope="col">Result</th>
              <th scope="col">Record</th>
              <th scope="col">Message</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rowNumber}>
                <td data-label="Row">{row.rowNumber}</td>
                <td data-label="Result">
                  <span
                    className={`import-disposition import-disposition--${row.disposition}`}
                  >
                    {row.disposition}
                  </span>
                </td>
                <td data-label="Record">
                  {recordLabel(row.value)}
                </td>
                <td data-label="Message">
                  {row.messages.join(" ") || "Ready to import."}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4}>No preview rows match these filters.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
