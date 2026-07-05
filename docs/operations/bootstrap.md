# System Bootstrap

## Supabase

Apply every tracked migration in `supabase/migrations` before starting the app
against a new project.

Required environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
APP_TIME_ZONE
```

The publishable key is safe for the browser and constrained by Row Level
Security. The service-role key bypasses Row Level Security and must remain in
server-only local or Vercel secrets.

## Sample master data

`supabase/seed.sql` inserts four sample employees and three named sites. Andre
Cole and Luis Rivera have Atlas as their Current Site; Marcus Hill and Daniel
Reyes remain Unassigned. Luis Rivera intentionally has no Employee ID/PIN.

## First Super Admin

No public signup exists. Configure the Supabase URL and service-role key, set
`BOOTSTRAP_SUPER_ADMIN_PASSWORD` in the current shell, and run:

```powershell
$env:BOOTSTRAP_SUPER_ADMIN_PASSWORD='a-long-private-password'
node scripts/bootstrap-super-admin.mjs --username developer --display-name "Developer"
Remove-Item Env:BOOTSTRAP_SUPER_ADMIN_PASSWORD
```

After signing in, use **System users** to create Timekeepers and Admins. Every
Timekeeper must be assigned to one active site during creation.
