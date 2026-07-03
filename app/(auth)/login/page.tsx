import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/app/(auth)/login/login-form";
import { getHomeForRole } from "@/lib/auth/permissions";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const authenticated = await getCurrentProfile();
  if (authenticated) redirect(getHomeForRole(authenticated.profile.role));

  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="eyebrow">Site Logger · Access control</p>
        <h1>Enter the field log.</h1>
        <p>
          Use the username and password issued by your Super Admin. Employee
          badges do not sign in here.
        </p>
        <LoginForm />
      </section>
      <aside className="login-proof" aria-label="Attendance evidence">
        <span className="login-proof__index">01</span>
        <strong>Authenticated operator</strong>
        <span className="login-proof__index">02</span>
        <strong>Fresh GPS evidence</strong>
        <span className="login-proof__index">03</span>
        <strong>Immutable scan record</strong>
      </aside>
    </main>
  );
}
