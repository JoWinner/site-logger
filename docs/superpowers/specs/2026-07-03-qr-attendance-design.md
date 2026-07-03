# QR Attendance System Design

## Purpose

Build an installable Next.js web application for construction-site attendance. A signed-in Timekeeper selects a site and attendance action, captures GPS, scans an employee QR badge, and receives an immediate result. Admins maintain employees, sites, attendance, manual review fields, and exports. Super Admins additionally manage application users and roles.

## Confirmed Product Scope

- Next.js App Router web application, installable as a PWA on PCs and tablets.
- Supabase Auth and PostgreSQL.
- Username-and-password login; users do not enter email addresses.
- Three roles: `timekeeper`, `admin`, and `super_admin`.
- Employees and sites are imported once, then maintained in the application.
- Employee ID/PIN is optional and never used as the internal primary key.
- Every new QR scan requires GPS latitude, longitude, accuracy, and capture time.
- GPS is recorded as evidence; no geofence or permitted-radius validation exists.
- No automatic employee-to-site assignment validation.
- Overtime check, assignment check, and payroll status are nullable manual fields.
- No automatic overtime calculation, payroll processing, or payroll approval.
- The system produces an `.xlsx` attendance export based on `company_worker_attendance_check_in.xlsx`.
- The owner will deploy the finished application to Vercel.

## Deliberate First-Release Boundaries

- Scanning requires an internet connection. The PWA shows connection status but does not queue attendance offline.
- Workers do not sign in or scan themselves.
- There is no public registration.
- There is no native iOS or Android application.
- Raw scan events are immutable. Admin corrections affect the session summary and create audit records.

## Visual Direction

The interface uses an industrial field-ledger aesthetic: deep ink green, warm concrete, safety orange, and high-contrast cream. Barlow Condensed provides concise operational headings; Atkinson Hyperlegible supports legibility on tablets and in bright environments. Controls are large, tactile, and unambiguous. The Timekeeper screen prioritizes the site, action, camera, GPS state, and latest result; administrative screens use dense but readable ledger tables.

## User Roles

### Timekeeper

- Sign in and sign out.
- Select an active site.
- Choose Check In or Check Out.
- Grant camera and GPS permissions.
- Scan active employee badges.
- View their own recent scans.
- View the resulting attendance session.
- Enter or revise nullable manual fields on sessions they created.

### Admin

- All Timekeeper capabilities.
- View all attendance.
- Create, edit, activate, and deactivate employees and sites.
- Issue, revoke, reissue, and print employee QR badges.
- Edit nullable manual fields on any attendance session.
- Correct session summaries while preserving immutable scan events.
- Filter and export attendance to `.xlsx`.

### Super Admin

- All Admin capabilities.
- Create, activate, deactivate, and reset passwords for application users.
- Assign roles.
- View the full audit log.

## Authentication

Supabase Auth remains the credential authority. The UI accepts `username` and `password`. The server normalizes the username to lowercase and derives an internal email-shaped identifier:

```text
<normalized-username>@site-logger.local
```

The internal identifier is never displayed. Public signup is absent. Super Admin user-management routes use the Supabase service-role key on the server only. Profiles reference `auth.users.id`, store the visible username, display name, role, and active state, and are protected by Row Level Security.

## Employee Identity and QR Codes

`employees.id` is a generated UUID. `employee_id_pin` is nullable. A partial unique index prevents duplicate non-empty IDs without requiring them.

QR badges never contain names, IDs, or other personal information. A badge contains an opaque random token. Supabase stores the token hash, employee reference, issue metadata, and revocation metadata. Reissuing a badge revokes the previous token. The scan RPC hashes the presented token and resolves the active employee.

## Scan Workflow

1. Timekeeper signs in.
2. Timekeeper selects an active site.
3. Timekeeper chooses Check In or Check Out.
4. The browser captures a fresh geolocation reading.
5. The camera scans the employee QR token.
6. The client sends the token, site, action, device time, GPS values, and idempotency key to a server route.
7. The server validates the session and calls a secured Supabase database function.
8. The function validates the user role, active profile, active site, active employee, active QR token, and idempotency key.
9. The function creates an immutable scan event and opens or closes an attendance session.
10. The UI shows a success or specific error state and refreshes recent scans.

A scan is not saved when GPS permission is denied, unavailable, stale, or missing. GPS accuracy is stored but is not used to accept or reject based on distance.

## Attendance Behavior

### Check In

- Creates an immutable `attendance_events` row.
- Creates a new open `attendance_sessions` row.
- A second Check In while an open session exists returns `already_checked_in` and creates no event.

### Check Out

- Creates an immutable `attendance_events` row.
- Closes the employee's most recent open session.
- Check Out without an open session returns `no_open_session` and creates no event.

### Hours

`worked_minutes` is calculated when a session closes. Displayed hours equal `worked_minutes / 60`, rounded to two decimal places. The value does not imply overtime.

### Manual fields

- `overtime_check`: nullable boolean.
- `assignment_check`: nullable boolean.
- `payroll_status`: nullable enum with `pending`, `approved`, `on_hold`, and `paid`.
- `notes`: nullable text, limited to 1,000 characters.

Timekeepers may edit manual fields only on sessions where they recorded Check In or Check Out. Admins and Super Admins may edit any session. Every change creates an audit record containing prior and new values.

## Data Model

### `profiles`

- `id uuid primary key references auth.users`
- `username citext unique not null`
- `display_name text not null`
- `role app_role not null`
- `is_active boolean not null default true`
- timestamps

### `employees`

- `id uuid primary key`
- `employee_id_pin text null`
- `full_name text not null`
- `trade_role text null`
- `crew text null`
- `is_active boolean not null default true`
- timestamps and creator/updater

### `sites`

- `id uuid primary key`
- `site_code text unique not null`
- `name text not null`
- `is_active boolean not null default true`
- timestamps and creator/updater

### `employee_qr_tokens`

- `id uuid primary key`
- `employee_id uuid not null`
- `token_hash text unique not null`
- `issued_at`, `issued_by`, `revoked_at`, `revoked_by`

### `attendance_events`

- `id uuid primary key`
- `idempotency_key uuid unique not null`
- `employee_id`, `site_id`, `action`, `captured_by`
- `device_captured_at`, `server_received_at`
- `latitude`, `longitude`, `accuracy_metres`, `location_captured_at`
- `qr_token_id`
- immutable creation timestamp

### `attendance_sessions`

- `id uuid primary key`
- employee and site references
- `work_date`
- check-in and check-out event references
- check-in and check-out timestamps, GPS snapshots, and Timekeeper references
- `worked_minutes`
- nullable manual fields and notes
- `status`: `open`, `complete`, `incomplete`, or `corrected`
- timestamps

### `attendance_corrections`

- session reference
- previous values and corrected values as JSON
- reason
- correcting Admin
- timestamp

### `audit_logs`

- actor, action, entity type, entity ID
- previous and new values as JSON
- timestamp

## Row Level Security

- Anonymous users receive no table access.
- Active authenticated users can read their own profile.
- Active operational users can read active employees and sites.
- Attendance events are created only through the secured scan function.
- Timekeepers can read sessions involving events they captured.
- Admins and Super Admins can read all attendance, employees, sites, and QR metadata.
- Only Admins and Super Admins can modify employees and sites.
- Only Super Admins can manage profiles and roles through server-only routes.
- Service-role credentials never appear in client code.

## Application Structure

```text
app/
  (auth)/login/
  (protected)/layout.tsx
  (protected)/timekeeper/
  (protected)/admin/
  (protected)/super-admin/
  api/auth/
  api/scans/
  api/admin/
  api/exports/
components/
  app-shell/
  attendance/
  scanner/
  ui/
lib/
  auth/
  attendance/
  exports/
  qr/
  supabase/
  validation/
supabase/
  migrations/
tests/
```

Server Components load protected data. Client Components are reserved for camera, geolocation, forms requiring immediate interaction, and the PWA installer. Route Handlers perform service-role operations and secured scan orchestration.

## Attendance Export

The `.xlsx` export preserves the sample workbook's A–P layout:

| Column | Heading |
|---|---|
| A | Date |
| B | Employee Name |
| C | Employee ID / PIN |
| D | Job Site |
| E | Check In |
| F | Check Out |
| G | Hours |
| H | Check In GPS |
| I | Check Out GPS |
| J | Check In By |
| K | Check Out By |
| L | Overtime Check |
| M | Assignment Check |
| N | Payroll Status |
| O | Notes |
| P | Attendance Status |

Employee name, optional ID/PIN, and site name are exported from session snapshots so historical reports remain readable after master-data changes. GPS exports as `latitude, longitude (±accuracy m)`. Missing optional values remain blank.

## PWA Behavior

- App Router metadata manifest.
- Standalone display mode and installable icons.
- Service worker caches only the static application shell.
- Authenticated API responses and attendance data are never cached.
- A visible offline banner explains that scans require a connection.
- Signing out clears application state before returning to login.

## Error Handling

The scan API returns stable error codes: `invalid_qr`, `revoked_qr`, `inactive_employee`, `inactive_site`, `gps_required`, `already_checked_in`, `no_open_session`, `duplicate_request`, `not_authorized`, and `server_error`. The UI translates each code into a concise action-oriented message.

Database errors are logged without QR tokens, passwords, service keys, or unnecessary personal data. User-facing errors never expose SQL or infrastructure details.

## Testing

- Unit tests cover username normalization, QR token handling, scan validation, session transitions, GPS validation, manual fields, and export mapping.
- Database tests cover constraints, secured functions, and RLS policies.
- Component tests cover login, scan-state feedback, tables, and role navigation.
- Playwright tests cover role routing, the Timekeeper scan workflow with mocked browser camera/GPS boundaries, Admin maintenance, and export authorization.
- Production verification includes lint, TypeScript, unit tests, database tests, Playwright, build, responsive browser inspection, and Supabase schema inspection.

## Completion

The system is ready when the live `site-logger` Supabase schema is migrated, the application passes all verification, the supplied sample workbook shape is covered by export tests, documentation explains configuration and deployment, and only Vercel credentials/deployment remain for the owner.
