"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { ImportPreviewTable } from "@/components/imports/import-preview";
import type {
  ImportEntity,
  ImportPreview,
  ImportValue,
} from "@/lib/imports/types";

export function MasterDataImport({ entity }: { entity: ImportEntity }) {
  const router = useRouter();
  const [preview, setPreview] = useState<ImportPreview<ImportValue> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<"preview" | "commit" | null>(null);

  async function previewFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setPreview(null);
    setPending("preview");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/imports/${entity}/preview`, {
      method: "POST",
      body: form,
    });
    const result = (await response.json()) as ImportPreview<ImportValue> & {
      error?: string;
    };
    if (!response.ok) {
      setMessage(result.error ?? "The file could not be previewed.");
      setPending(null);
      return;
    }
    setPreview(result);
    setPending(null);
  }

  async function commitImport() {
    if (!preview || preview.summary.error > 0) return;
    setMessage(null);
    setPending("commit");
    const response = await fetch(`/api/admin/imports/${entity}/commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rows: preview.rows.flatMap((row) => (row.value ? [row.value] : [])),
      }),
    });
    const result = (await response.json()) as {
      created?: number;
      updated?: number;
      error?: string;
    };
    if (!response.ok) {
      setMessage(result.error ?? "The import could not be committed.");
      setPending(null);
      return;
    }
    setMessage(
      `Import complete: ${result.created ?? 0} created, ${result.updated ?? 0} updated.`,
    );
    setPreview(null);
    setPending(null);
    router.refresh();
  }

  const label = entity === "employees" ? "employees" : "sites";

  return (
    <div className="import-station">
      <p className="form-note">
        Upload CSV or XLSX. Preview every row before changing {label}.
      </p>
      <form className="import-form" onSubmit={previewFile}>
        <label className="field">
          <span>{entity === "employees" ? "Employee file" : "Site file"}</span>
          <input
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            name="file"
            required
            type="file"
          />
        </label>
        <button className="button" disabled={pending !== null} type="submit">
          {pending === "preview" ? "Reading file…" : "Preview import"}
        </button>
      </form>
      {preview ? <ImportPreviewTable preview={preview} /> : null}
      {preview ? (
        <div className="form-actions">
          <button
            className="button button--signal"
            disabled={pending !== null || preview.summary.error > 0}
            onClick={commitImport}
            type="button"
          >
            {pending === "commit" ? "Importing…" : `Import ${preview.summary.total} rows`}
          </button>
          {preview.summary.error > 0 ? (
            <span className="form-note">Fix file errors before importing.</span>
          ) : null}
        </div>
      ) : null}
      {message ? (
        <p className={message.startsWith("Import complete") ? "form-note" : "form-error"}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
