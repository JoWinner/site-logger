"use client";

import { useState } from "react";

import { SiteForm } from "@/app/(protected)/admin/sites/site-form";
import { RecordDialog } from "@/components/data/record-dialog";
import {
  ResponsiveTable,
  type ResponsiveColumn,
} from "@/components/data/responsive-table";
import type { SiteRow } from "@/lib/database.types";

const columns: ResponsiveColumn<SiteRow>[] = [
  {
    key: "status",
    label: "Status",
    render: (site) => (
      <span className="record-status">
        <span
          aria-hidden="true"
          className={`status-pip ${site.is_active ? "is-active" : ""}`}
        />
        {site.is_active ? "Active" : "Inactive"}
      </span>
    ),
  },
  {
    key: "name",
    label: "Site",
    render: (site) => <strong>{site.name}</strong>,
  },
  {
    key: "code",
    label: "Site Code",
    render: (site) => <code>{site.site_code}</code>,
  },
  {
    key: "updated",
    label: "Updated",
    render: (site) => (
      <time dateTime={site.updated_at}>{site.updated_at.slice(0, 10)}</time>
    ),
  },
];

export function SiteLedger({ sites }: { sites: SiteRow[] }) {
  const [editing, setEditing] = useState<SiteRow | null>(null);

  return (
    <>
      <ResponsiveTable
        actions={(site) => (
          <button
            aria-label={`Edit ${site.name}`}
            className="button button--compact"
            onClick={() => setEditing(site)}
            type="button"
          >
            Edit
          </button>
        )}
        caption="Site ledger"
        columns={columns}
        emptyMessage="No sites yet. Add or import the first site."
        rows={sites}
      />
      <RecordDialog
        onClose={() => setEditing(null)}
        open={editing !== null}
        title={editing ? `Edit ${editing.name}` : "Edit site"}
      >
        {editing ? (
          <SiteForm
            site={{
              id: editing.id,
              siteCode: editing.site_code,
              name: editing.name,
              isActive: editing.is_active,
            }}
          />
        ) : null}
      </RecordDialog>
    </>
  );
}
