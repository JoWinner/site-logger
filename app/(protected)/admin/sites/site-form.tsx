"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

interface ExistingSite {
  id: string;
  siteCode: string;
  name: string;
  isActive: boolean;
}

export function SiteForm({ site }: { site?: ExistingSite }) {
  const router = useRouter();
  const siteCodeId = useId();
  const siteCodeHintId = `${siteCodeId}-hint`;
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch(
      site ? `/api/admin/sites/${site.id}` : "/api/admin/sites",
      {
        method: site ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteCode: form.get("siteCode"),
          name: form.get("name"),
          isActive: form.get("isActive") === "on",
        }),
      },
    );
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(result.error ?? "Site could not be saved.");
      setPending(false);
      return;
    }
    if (!site) formElement.reset();
    setMessage("Site saved.");
    setPending(false);
    router.refresh();
  }

  return (
    <form className={site ? "record-form record-form--compact" : "record-form"} onSubmit={submit}>
      <div className="field">
        <label htmlFor={siteCodeId}>Permanent site code *</label>
        <input
          aria-describedby={siteCodeHintId}
          defaultValue={site?.siteCode}
          id={siteCodeId}
          name="siteCode"
          required
        />
        <small className="field-hint" id={siteCodeHintId}>
          Each site needs a different code, for example ATLAS or POKUASE.
        </small>
      </div>
      <label className="field">
        <span>Site name *</span>
        <input defaultValue={site?.name} name="name" required />
      </label>
      <label className="check-field">
        <input defaultChecked={site?.isActive ?? true} name="isActive" type="checkbox" />
        <span>Active site</span>
      </label>
      <div className="form-actions">
        <button className="button" disabled={pending} type="submit">
          {pending ? "Saving…" : site ? "Update site" : "Add site"}
        </button>
        {message ? <span className="form-note">{message}</span> : null}
      </div>
    </form>
  );
}
