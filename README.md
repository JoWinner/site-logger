# Site Logger

Site Logger is an installable Next.js attendance system for construction
sites. Each Timekeeper is assigned to one site, captures fresh GPS evidence,
and scans employee QR badges for Check In and Check Out. Supabase stores
immutable scan events and auditable attendance sessions.

## Capabilities

- Username-and-password sign-in through Supabase Auth
- Timekeeper, Admin, and Super Admin interfaces
- One enforced site assignment per Timekeeper
- Flexible, nullable Current Site metadata for employees
- Optional Employee ID/PIN
- Individual and bulk-issued revocable QR badges
- CSV/XLSX employee and site imports with preview and validation
- Mandatory raw GPS coordinates and accuracy for every scan
- Searchable, sortable, filterable employee, site, user, and attendance ledgers
- Employee and attendance ledgers grouped into separate site sections
- Admin multi-site and Timekeeper assigned-site CSV/XLSX attendance exports
- Manual nullable overtime, assignment, payroll, and notes fields
- Auditable corrections without changing original scan events
- Installable PWA for PCs and tablets

Employees are not restricted to their Current Site. They can be scanned at any
site; the authenticated Timekeeper's assigned site determines where attendance
is recorded.

## Local setup

1. Install Node.js 20.9 or newer and pnpm 10.32.1.
2. Copy `.env.example` to `.env.local`.
3. Add the Supabase publishable key and service-role key.
4. Run `pnpm install`.
5. Run `pnpm dev`.
6. Open `http://localhost:3000`.

The configured Supabase project is `site-logger`
(`jbdzjguihkzdigicmxpx`).

## Master data imports

Admins and Super Admins can import employees and sites from CSV or XLSX on
their respective pages. Imports are previewed before commit and accept up to
2,000 rows in a 5 MB file.

- Employees: `Full Name` is required. `Employee ID/PIN`, `Trade Role`,
  `Site Code` or `Site Name`, and `Active` are optional.
- Sites: `Site Code` and `Site Name` are required. `Active` is optional.
- Existing employees match by Employee ID/PIN. ID-less employees create a new
  record after a duplicate-name warning.
- Employee Current Site is organizational metadata only and can be changed or
  cleared at any time.

## First Super Admin

The first Super Admin is the initial trusted account used to create all other
Timekeepers, Admins, and Super Admins. Public registration is disabled.

Set `BOOTSTRAP_SUPER_ADMIN_PASSWORD` only in the current terminal, then run:

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
- `PROJECT_ROADMAP.md`
