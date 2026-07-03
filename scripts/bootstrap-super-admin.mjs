import { createClient } from "@supabase/supabase-js";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1]?.trim() : undefined;
}

const url = required("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
const password = required("BOOTSTRAP_SUPER_ADMIN_PASSWORD");
const username = argument("username")?.toLowerCase();
const displayName = argument("display-name");

if (!username || !/^[a-z0-9._-]{3,32}$/.test(username)) {
  throw new Error(
    "Pass --username with 3-32 lowercase letters, numbers, dots, dashes, or underscores.",
  );
}
if (!displayName) throw new Error("Pass --display-name.");
if (password.length < 10) {
  throw new Error("BOOTSTRAP_SUPER_ADMIN_PASSWORD must be at least 10 characters.");
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const email = `${username}@site-logger.local`;

const { data: existingProfile } = await supabase
  .from("profiles")
  .select("id")
  .eq("username", username)
  .maybeSingle();

if (existingProfile) {
  console.log(`Super Admin @${username} already exists; no changes made.`);
  process.exit(0);
}

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (error || !data.user) {
  throw new Error(error?.message ?? "Supabase Auth user creation failed.");
}

const { error: profileError } = await supabase.from("profiles").insert({
  id: data.user.id,
  username,
  display_name: displayName,
  role: "super_admin",
  is_active: true,
});

if (profileError) {
  await supabase.auth.admin.deleteUser(data.user.id);
  throw new Error(`Profile creation failed: ${profileError.message}`);
}

console.log(`Created Super Admin @${username}. Password was not printed.`);
