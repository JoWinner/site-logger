import { redirect } from "next/navigation";

import { getHomeForRole } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";

export default async function DashboardPage() {
  const { profile } = await requireProfile();
  redirect(getHomeForRole(profile.role));
}
