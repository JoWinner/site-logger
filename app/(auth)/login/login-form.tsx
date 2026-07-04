"use client";

import { useState, type FormEvent } from "react";

import { PasswordField } from "@/components/forms/password-field";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
      }),
    });

    const result = (await response.json()) as {
      error?: string;
      redirectTo?: string;
    };

    if (!response.ok || !result.redirectTo) {
      setError(result.error ?? "Sign in failed. Try again.");
      setPending(false);
      return;
    }

    window.location.assign(result.redirectTo);
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Username</span>
        <input
          name="username"
          autoComplete="username"
          minLength={3}
          maxLength={32}
          required
        />
      </label>
      <PasswordField
        autoComplete="current-password"
        label="Password"
        name="password"
        required
      />
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button button--signal" disabled={pending} type="submit">
        {pending ? "Opening log…" : "Sign in"}
      </button>
    </form>
  );
}
