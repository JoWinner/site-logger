# Site Logger

Site Logger is an installable Next.js attendance system for construction sites. A Timekeeper selects a site and Check In/Check Out action, captures fresh GPS evidence, and scans an employee's opaque QR badge. Supabase stores immutable scan events and auditable attendance sessions.

## Capabilities

- Username-and-password sign-in through Supabase Auth
- Timekeeper, Admin, and Super Admin interfaces
- Optional Employee ID/PIN
- Revocable individual and bulk-issued employee QR badges
- CSV/XLSX employee and site imports with preview and validation
- GPS captured for every new attendance scan
- Mapbox reverse-geocoded location names and static map evidence
- No geofence or employee-to-site assignment enforcement
- Manual nullable overtime check, assignment check, and payroll status
- Auditable corrections without changing original scan events
- Responsive attendance, employee, and site ledgers with mobile card layouts
- Attendance quick preview with review, correction, and full-history actions
- A–P `.xlsx` attendance export based on the supplied sample workbook
- Installable PWA for PCs and tablets

## Local setup

1. Install Node.js 20.9 or newer and pnpm 10.32.1 (or enable Corepack).
2. Copy `.env.example` to `.env.local`.
3. Add the Supabase publishable key and service-role key.
4. Add a Mapbox access token. Use `MAPBOX_GEOCODING_MODE=temporary` for
   testing and `MAPBOX_GEOCODING_MODE=permanent` when the account is licensed
   to retain geocoding results.
5. Run `pnpm install`.
6. Run `pnpm dev`.
7. Open `http://localhost:3000`.

The configured Supabase project is `site-logger`
(`jbdzjguihkzdigicmxpx`). All tracked migrations have been applied to that
project.

## Master data imports

Admins and Super Admins can import employees and sites from CSV or XLSX on
their respective ledger pages. Imports are previewed before commit and accept
up to 2,000 rows in a 5 MB file.

- Employees: `Full Name` is required. `Employee ID/PIN`, `Trade Role`, `Crew`,
  and `Active` are optional.
- Sites: `Site Code` and `Site Name` are required. `Active` is optional.
- Existing employees match by Employee ID/PIN. Existing sites match by Site
  Code. ID-less employees are created as separate records after a duplicate-name
  warning.

## Mapbox location retention

Every scan stores GPS coordinates and accuracy in Supabase. Mapbox converts
coordinates to a readable place name. Temporary mode returns the name to the
Timekeeper for the current scan but does not retain the Mapbox result.
Permanent mode stores the resolved name and feature ID on the immutable
attendance evidence through the restricted resolver function.

`MAPBOX_ACCESS_TOKEN` is server-only. Do not prefix it with `NEXT_PUBLIC_`.

## First Super Admin

Set `BOOTSTRAP_SUPER_ADMIN_PASSWORD` in the current terminal without committing it, then run:

```powershell
$env:BOOTSTRAP_SUPER_ADMIN_PASSWORD='a-long-private-password'
node scripts/bootstrap-super-admin.mjs --username developer --display-name "Developer"
Remove-Item Env:BOOTSTRAP_SUPER_ADMIN_PASSWORD
```

The script is idempotent and never prints the password.

## Commands

```text
pnpm dev          Start local development
pnpm test         Run unit and component tests
pnpm typecheck    Run strict TypeScript checks
pnpm lint         Run source linting
pnpm build        Create the production build
pnpm test:e2e     Run Playwright tests
```

## Documentation

- `docs/operations/timekeeper-guide.md`
- `docs/operations/admin-guide.md`
- `docs/operations/bootstrap.md`
- `docs/operations/deployment.md`
- `docs/superpowers/specs/2026-07-03-qr-attendance-design.md`
- `PROJECT_ROADMAP.md`
