"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { PasswordField } from "@/components/forms/password-field";
import type { AppRole, SiteRow } from "@/lib/database.types";

interface ExistingUser {
  id: string;
  displayName: string;
  role: AppRole;
  assignedSiteId: string | null;
  isActive: boolean;
}

export function UserForm({
  sites = [],
  user,
}: {
  sites?: SiteRow[];
  user?: ExistingUser;
}) {
  const router = useRouter();
  const [role, setRole] = useState<AppRole>(user?.role ?? "timekeeper");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const password = String(form.get("password") ?? "");
    const response = await fetch(user ? `/api/super-admin/users/${user.id}` : "/api/super-admin/users", {
      method: user ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        user
          ? {
              displayName: form.get("displayName"),
              role,
              assignedSiteId:
                role === "timekeeper" ? form.get("assignedSiteId") : null,
              isActive: form.get("isActive") === "on",
              password: password || null,
            }
          : {
              username: form.get("username"),
              displayName: form.get("displayName"),
              role,
              assignedSiteId:
                role === "timekeeper" ? form.get("assignedSiteId") : null,
              password,
            },
      ),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(result.error ?? "User could not be saved.");
      setPending(false);
      return;
    }
    if (!user) formElement.reset();
    setMessage("User saved.");
    setPending(false);
    router.refresh();
  }

  return (
    <form className={user ? "record-form record-form--compact" : "record-form"} onSubmit={submit}>
      {!user ? <label className="field"><span>Username *</span><input name="username" required /></label> : null}
      <label className="field"><span>Display name *</span><input defaultValue={user?.displayName} name="displayName" required /></label>
      <label className="field"><span>Role *</span><select name="role" onChange={(event) => setRole(event.target.value as AppRole)} value={role}><option value="timekeeper">Timekeeper</option><option value="admin">Admin</option><option value="super_admin">Super Admin</option></select></label>
      {role === "timekeeper" ? (
        <label className="field">
          <span>Assigned site *</span>
          <select
            defaultValue={user?.assignedSiteId ?? ""}
            name="assignedSiteId"
            required
          >
            <option disabled value="">Select a site</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.site_code} · {site.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <PasswordField
        autoComplete="new-password"
        label={
          user
            ? "New password (leave blank to keep)"
            : "Initial password *"
        }
        minLength={10}
        name="password"
        required={!user}
      />
      {user ? <label className="check-field"><input defaultChecked={user.isActive} name="isActive" type="checkbox" /><span>Active account</span></label> : null}
      <div className="form-actions"><button className="button" disabled={pending} type="submit">{pending ? "Saving…" : user ? "Update user" : "Create user"}</button>{message ? <span className="form-note">{message}</span> : null}</div>
    </form>
  );
}
