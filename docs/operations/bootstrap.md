# System Bootstrap

## Supabase

The database migration is tracked in `supabase/migrations/20260703010211_initial_attendance_schema.sql`. Apply migrations through the Supabase migration workflow before starting the app against a new project.

Required environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
APP_TIME_ZONE
MAPBOX_ACCESS_TOKEN
MAPBOX_GEOCODING_MODE
```

The publishable key is safe for the browser and remains constrained by Row Level Security. The service-role key bypasses Row Level Security and must exist only in server/Vercel secrets.

The Mapbox token is also server-only. Use `temporary` for non-retained testing.
Use `permanent` only when the Mapbox account is licensed for permanent
geocoding storage. Permanent mode stores the resolved location through a
restricted database function; it never lets the client update scan evidence.

Tracked migrations, in order:

1. `20260703010211_initial_attendance_schema.sql`
2. `20260704110710_master_data_imports.sql`
3. `20260704111513_attendance_location_labels.sql`
4. `20260704112708_bulk_qr_badges.sql`
5. `20260704113709_database_advisor_hardening.sql`
6. `20260704113933_private_attendance_mutations.sql`

## Sample master data

`supabase/seed.sql` inserts the workbook's four sample employees and three named sites. Luis Rivera intentionally has no Employee ID/PIN to verify the optional-ID workflow. The seed does not invent GPS attendance records.

## First Super Admin

No public signup exists. Configure the Supabase URL and service-role key, set `BOOTSTRAP_SUPER_ADMIN_PASSWORD` in the current shell, and run:

```powershell
$env:BOOTSTRAP_SUPER_ADMIN_PASSWORD='a-long-private-password'
node scripts/bootstrap-super-admin.mjs --username developer --display-name "Developer"
Remove-Item Env:BOOTSTRAP_SUPER_ADMIN_PASSWORD
```

After signing in, use **System users** to create Timekeepers and Admins.
