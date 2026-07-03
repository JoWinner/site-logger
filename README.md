# Site Logger

Site Logger is an installable Next.js attendance system for construction sites. A Timekeeper selects a site and Check In/Check Out action, captures fresh GPS evidence, and scans an employee's opaque QR badge. Supabase stores immutable scan events and auditable attendance sessions.

## Capabilities

- Username-and-password sign-in through Supabase Auth
- Timekeeper, Admin, and Super Admin interfaces
- Optional Employee ID/PIN
- Revocable employee QR badges
- GPS captured for every new attendance scan
- No geofence or employee-to-site assignment enforcement
- Manual nullable overtime check, assignment check, and payroll status
- Auditable corrections without changing original scan events
- A–P `.xlsx` attendance export based on the supplied sample workbook
- Installable PWA for PCs and tablets

## Local setup

1. Install Node.js 20.9 or newer and pnpm 11.
2. Copy `.env.example` to `.env.local`.
3. Add the Supabase publishable key and service-role key.
4. Run `pnpm install`.
5. Run `pnpm dev`.
6. Open `http://localhost:3000`.

The configured Supabase project is `site-logger` (`jbdzjguihkzdigicmxpx`). The initial migration has been applied to that project.

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
