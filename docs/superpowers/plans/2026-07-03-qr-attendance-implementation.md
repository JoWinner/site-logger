# QR Attendance System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify an installable Next.js application backed by the live `site-logger` Supabase project for GPS-evidenced employee QR attendance.

**Architecture:** Next.js 16 App Router renders role-specific server pages and uses small client islands for scanning, GPS, and interactive forms. Supabase Auth provides username-derived password sessions, PostgreSQL functions enforce atomic scans, Row Level Security protects direct data access, and server-only routes handle privileged user management and Excel exports.

**Tech Stack:** Next.js 16.2.10, React 19.2.7, TypeScript, Supabase JS 2.110.0, Supabase SSR 0.12.0, Vitest 4.1.9, Playwright 1.61.1, ZXing Browser 0.2.0, QRCode 1.5.4, ExcelJS 4.4.0, CSS Modules/global CSS.

## Global Constraints

- Employee ID/PIN is nullable and never used as an internal primary key.
- Every newly accepted scan includes GPS latitude, longitude, accuracy, and capture time.
- GPS is evidence only; no geofence or permitted-distance validation exists.
- No automatic assignment, overtime, or payroll validation exists.
- `overtime_check`, `assignment_check`, and `payroll_status` remain nullable and manually editable by authorized roles.
- Raw scan events are immutable.
- Service-role credentials remain server-only.
- Public signup and worker self-service scanning do not exist.
- Online connectivity is required to record a scan in v1.
- The final `.xlsx` export uses the approved A–P column contract.

---

### Task 1: Project Foundation and Username Domain

**Files:**
- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `lib/auth/username.ts`
- Create: `tests/unit/auth/username.test.ts`
- Create: `.env.example`

**Interfaces:**
- Produces: `normalizeUsername(value: string): string`
- Produces: `usernameToInternalEmail(username: string): string`
- Produces: `getRequiredEnv(name: string): string`

- [ ] Create the test and tooling configuration, with a failing test asserting that `Site Keeper` normalizes to `sitekeeper`, invalid characters are rejected, and the internal email becomes `sitekeeper@site-logger.local`.
- [ ] Run `pnpm test tests/unit/auth/username.test.ts`; expect failure because `lib/auth/username.ts` does not exist.
- [ ] Implement strict username normalization, internal-email derivation, environment validation, the root layout, and the base global style tokens.
- [ ] Run the focused test and `pnpm typecheck`; expect both to pass.
- [ ] Commit with `git commit -m "chore: establish Next.js project foundation"`.

### Task 2: Database Schema, Scan Function, and RLS

**Files:**
- Create: `supabase/migrations/202607030001_initial_attendance_schema.sql`
- Create: `supabase/tests/attendance_schema.sql`
- Create: `lib/database.types.ts`
- Test: `supabase/tests/attendance_schema.sql`

**Interfaces:**
- Produces: PostgreSQL enums `app_role`, `attendance_action`, `attendance_status`, and `payroll_status`.
- Produces: tables `profiles`, `employees`, `sites`, `employee_qr_tokens`, `attendance_events`, `attendance_sessions`, `attendance_corrections`, and `audit_logs`.
- Produces: `record_attendance_scan(...) returns jsonb`.
- Produces: `update_attendance_manual_fields(...) returns attendance_sessions`.

- [ ] Write pgTAP-style assertions for nullable employee ID/PIN, unique non-empty IDs, immutable events, required GPS, role policies, and scan state transitions.
- [ ] Apply an intentionally incomplete migration to a disposable transaction or local parser and confirm the assertions fail for missing tables/functions.
- [ ] Write the complete migration with extensions, enums, tables, constraints, indexes, helper authorization functions, scan RPC, manual-field RPC, audit triggers, grants, and RLS policies.
- [ ] Apply the migration to the live `site-logger` project through the Supabase migration tool.
- [ ] Run schema assertions through SQL and inspect tables, policies, functions, and indexes; expect all checks to pass.
- [ ] Generate and commit aligned TypeScript database types.
- [ ] Commit with `git commit -m "feat: add secure attendance database schema"`.

### Task 3: Supabase Clients, Login, and Role Protection

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/admin.ts`
- Create: `lib/supabase/proxy.ts`
- Create: `proxy.ts`
- Create: `lib/auth/session.ts`
- Create: `lib/auth/permissions.ts`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/login/login-form.tsx`
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/logout/route.ts`
- Create: `tests/unit/auth/permissions.test.ts`
- Create: `tests/unit/auth/login-route.test.ts`

**Interfaces:**
- Produces: `getCurrentProfile()`
- Produces: `requireProfile(allowedRoles?: AppRole[])`
- Produces: POST `/api/auth/login`
- Produces: POST `/api/auth/logout`

- [ ] Write failing tests for role permission ordering, inactive-profile rejection, normalized username login, and generic invalid-credential errors.
- [ ] Run the focused tests; expect failures because auth modules and routes are absent.
- [ ] Implement browser/server/admin Supabase factories, cookie refresh proxy, profile guards, login route, logout route, and the username-only login form.
- [ ] Run auth unit tests, type checking, and linting; expect all to pass.
- [ ] Commit with `git commit -m "feat: add username authentication and role guards"`.

### Task 4: Industrial Design System and Protected App Shell

**Files:**
- Create: `components/ui/button.tsx`
- Create: `components/ui/badge.tsx`
- Create: `components/ui/field.tsx`
- Create: `components/ui/empty-state.tsx`
- Create: `components/ui/status-dot.tsx`
- Create: `components/app-shell/app-shell.tsx`
- Create: `components/app-shell/role-nav.tsx`
- Create: `components/app-shell/offline-banner.tsx`
- Create: `app/(protected)/layout.tsx`
- Create: `app/(protected)/dashboard/page.tsx`
- Create: `tests/unit/ui/role-nav.test.tsx`

**Interfaces:**
- Produces: reusable typed UI primitives.
- Produces: `getNavigationForRole(role: AppRole): NavigationItem[]`.

- [ ] Write a failing role-navigation test proving Timekeepers cannot see Admin or Super Admin links and Admins cannot see Super Admin user management.
- [ ] Run the focused test; expect failure because the shell does not exist.
- [ ] Implement the field-ledger visual system, responsive shell, role navigation, network banner, dashboard routing, and accessible focus/interaction states.
- [ ] Run component tests, type checking, and linting.
- [ ] Commit with `git commit -m "feat: add role-aware field ledger interface"`.

### Task 5: Employee and Site Administration

**Files:**
- Create: `lib/validation/employee.ts`
- Create: `lib/validation/site.ts`
- Create: `lib/employees/repository.ts`
- Create: `lib/sites/repository.ts`
- Create: `app/(protected)/admin/employees/page.tsx`
- Create: `app/(protected)/admin/employees/employee-form.tsx`
- Create: `app/(protected)/admin/sites/page.tsx`
- Create: `app/(protected)/admin/sites/site-form.tsx`
- Create: `app/api/admin/employees/route.ts`
- Create: `app/api/admin/employees/[id]/route.ts`
- Create: `app/api/admin/sites/route.ts`
- Create: `app/api/admin/sites/[id]/route.ts`
- Create: `tests/unit/validation/employee.test.ts`
- Create: `tests/unit/validation/site.test.ts`

**Interfaces:**
- Produces: employee and site create/update schemas.
- Produces: Admin CRUD routes with role enforcement.

- [ ] Write failing validation tests proving full name is required, Employee ID/PIN is optional, blank IDs normalize to null, and site codes are normalized and required.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement repositories, validation, routes, responsive ledger tables, create/edit forms, activation toggles, and empty/error states.
- [ ] Run focused tests, all unit tests, type checking, and linting.
- [ ] Commit with `git commit -m "feat: add employee and site administration"`.

### Task 6: QR Token Lifecycle and Printable Badges

**Files:**
- Create: `lib/qr/tokens.ts`
- Create: `lib/qr/badge.ts`
- Create: `app/api/admin/employees/[id]/qr/route.ts`
- Create: `app/(protected)/admin/employees/[id]/badge/page.tsx`
- Create: `components/attendance/employee-badge.tsx`
- Create: `tests/unit/qr/tokens.test.ts`
- Create: `tests/unit/qr/badge.test.ts`

**Interfaces:**
- Produces: `generateQrToken(): { rawToken: string; tokenHash: string }`
- Produces: `hashQrToken(rawToken: string): string`
- Produces: POST/DELETE QR lifecycle route.

- [ ] Write failing tests for cryptographically random opaque tokens, deterministic SHA-256 hashing, no personal data in payloads, and badge labels with blank optional ID/PIN.
- [ ] Run the focused tests; expect missing-module failures.
- [ ] Implement token generation/hashing, server-only issue/revoke/reissue logic, QR rendering, and print-optimized badge page.
- [ ] Run QR tests, all unit tests, type checking, and linting.
- [ ] Commit with `git commit -m "feat: add revocable employee QR badges"`.

### Task 7: GPS and Scanner Client Boundaries

**Files:**
- Create: `lib/attendance/gps.ts`
- Create: `lib/attendance/scan-errors.ts`
- Create: `components/scanner/qr-scanner.tsx`
- Create: `components/scanner/gps-status.tsx`
- Create: `components/scanner/scan-result.tsx`
- Create: `tests/unit/attendance/gps.test.ts`
- Create: `tests/unit/attendance/scan-errors.test.ts`

**Interfaces:**
- Produces: `captureFreshPosition(options): Promise<GpsEvidence>`
- Produces: `validateGpsEvidence(value): GpsEvidence`
- Produces: stable scan-code-to-message mapping.

- [ ] Write failing tests for valid coordinates, coordinate bounds, positive accuracy, stale readings, permission denial, timeout, and stable error copy.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement GPS validation/capture, ZXing camera lifecycle, permission states, scan result feedback, and safe cleanup on unmount.
- [ ] Run attendance unit tests, all unit tests, type checking, and linting.
- [ ] Commit with `git commit -m "feat: add GPS evidence and QR scanner"`.

### Task 8: Atomic Attendance Scan API

**Files:**
- Create: `lib/validation/scan.ts`
- Create: `lib/attendance/scan-service.ts`
- Create: `app/api/scans/route.ts`
- Create: `tests/unit/validation/scan.test.ts`
- Create: `tests/unit/attendance/scan-service.test.ts`

**Interfaces:**
- Produces: `ScanRequest` and `ScanResult`.
- Produces: `recordScan(input, profile, supabase): Promise<ScanResult>`.
- Produces: POST `/api/scans`.

- [ ] Write failing tests for required GPS, valid action/site/token/idempotency fields, authorization, stable database error mapping, and redaction of raw QR tokens from logs.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement input validation, secured RPC orchestration, stable HTTP status mapping, and privacy-safe error handling.
- [ ] Run scan tests, all unit tests, type checking, and linting.
- [ ] Commit with `git commit -m "feat: add atomic attendance scan endpoint"`.

### Task 9: Timekeeper Workflow

**Files:**
- Create: `app/(protected)/timekeeper/page.tsx`
- Create: `app/(protected)/timekeeper/scan-console.tsx`
- Create: `app/(protected)/timekeeper/recent-scans.tsx`
- Create: `lib/attendance/queries.ts`
- Create: `tests/unit/attendance/scan-console.test.tsx`

**Interfaces:**
- Consumes: QR scanner, GPS capture, scan API, active sites, and recent sessions.
- Produces: the complete repeated-scan Timekeeper workflow.

- [ ] Write failing component tests for required site/action selection, GPS-before-submit ordering, success reset, duplicate feedback, and recent-scan refresh.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement the touch-first scan console, site selector, Check In/Check Out control, camera panel, GPS state, result panel, and recent scan ledger.
- [ ] Run component tests, all tests, type checking, and linting.
- [ ] Commit with `git commit -m "feat: add timekeeper scanning workflow"`.

### Task 10: Attendance Review, Manual Fields, and Corrections

**Files:**
- Create: `lib/validation/manual-fields.ts`
- Create: `lib/attendance/manual-fields.ts`
- Create: `app/(protected)/admin/attendance/page.tsx`
- Create: `app/(protected)/admin/attendance/[id]/page.tsx`
- Create: `components/attendance/manual-fields-form.tsx`
- Create: `components/attendance/session-timeline.tsx`
- Create: `app/api/attendance/[id]/manual-fields/route.ts`
- Create: `app/api/admin/attendance/[id]/corrections/route.ts`
- Create: `tests/unit/attendance/manual-fields.test.ts`

**Interfaces:**
- Produces: nullable manual-field schema and update route.
- Produces: Admin session review and correction workflow.

- [ ] Write failing tests distinguishing null from false, validating payroll enum values, limiting notes, enforcing Timekeeper ownership, and requiring correction reasons.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement attendance filters, session detail, GPS/timestamp evidence, manual fields, immutable-event timeline, and correction audit flow.
- [ ] Run focused tests, all tests, type checking, and linting.
- [ ] Commit with `git commit -m "feat: add auditable attendance review"`.

### Task 11: Super Admin User Management

**Files:**
- Create: `lib/validation/app-user.ts`
- Create: `lib/auth/admin-users.ts`
- Create: `app/(protected)/super-admin/users/page.tsx`
- Create: `app/(protected)/super-admin/users/user-form.tsx`
- Create: `app/api/super-admin/users/route.ts`
- Create: `app/api/super-admin/users/[id]/route.ts`
- Create: `tests/unit/auth/admin-users.test.ts`

**Interfaces:**
- Produces: create/update/deactivate/password-reset operations using server-only Supabase Admin Auth.

- [ ] Write failing tests for username-derived internal email, public-signup absence, Super Admin authorization, inactive users, role updates, password resets, and last-Super-Admin protection.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement server-only admin-user service, routes, user ledger, create/edit/reset forms, and audit calls.
- [ ] Run auth tests, all tests, type checking, and linting.
- [ ] Commit with `git commit -m "feat: add super admin user management"`.

### Task 12: Excel Attendance Export

**Files:**
- Create: `lib/exports/attendance-columns.ts`
- Create: `lib/exports/attendance-workbook.ts`
- Create: `app/api/exports/attendance.xlsx/route.ts`
- Create: `tests/unit/exports/attendance-columns.test.ts`
- Create: `tests/unit/exports/attendance-workbook.test.ts`

**Interfaces:**
- Produces: exact A–P export mapping.
- Produces: authorized GET `/api/exports/attendance.xlsx`.

- [ ] Write failing tests for exact heading order, blank optional Employee ID/PIN, date/time formats, calculated hours, compact GPS strings, nullable manual values, and safe filename/content type.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement filtered attendance query, ExcelJS workbook generation, field-ledger styling, freeze/filter behavior, and server route authorization.
- [ ] Run export tests, all tests, type checking, and linting.
- [ ] Compare the generated workbook structurally with `company_worker_attendance_check_in.xlsx`.
- [ ] Commit with `git commit -m "feat: add Excel attendance export"`.

### Task 13: PWA Installation and Safe Caching

**Files:**
- Create: `app/manifest.ts`
- Create: `public/sw.js`
- Create: `public/icons/icon-192.svg`
- Create: `public/icons/icon-512.svg`
- Create: `components/app-shell/service-worker-registration.tsx`
- Create: `tests/unit/pwa/manifest.test.ts`

**Interfaces:**
- Produces: installable manifest and static-shell-only service worker.

- [ ] Write a failing manifest test for standalone display, icons, theme color, application name, and start URL.
- [ ] Run the focused test and confirm expected failure.
- [ ] Implement manifest, icons, service-worker registration, static-only caching, offline banner integration, and explicit exclusion of API/auth responses.
- [ ] Run PWA tests, all unit tests, type checking, linting, and a production build.
- [ ] Commit with `git commit -m "feat: make attendance app installable"`.

### Task 14: Sample Data, Bootstrap, and Database Verification

**Files:**
- Create: `supabase/seed.sql`
- Create: `scripts/bootstrap-super-admin.mjs`
- Create: `scripts/verify-database.mjs`
- Create: `docs/operations/bootstrap.md`
- Create: `tests/unit/fixtures/sample-attendance.test.ts`

**Interfaces:**
- Produces: idempotent sample employees/sites aligned with the supplied workbook.
- Produces: explicit first-Super-Admin bootstrap command.
- Produces: live database verification report.

- [ ] Write a failing fixture test proving the workbook sample supports blank Employee ID/PIN and blank historical site values without weakening new-scan validation.
- [ ] Run the focused test and confirm expected failure.
- [ ] Implement idempotent seed data for the four sample employees and three named sites, keeping imported historical rows separate from new GPS-required scans.
- [ ] Implement a secure bootstrap script that requires service-role configuration and creates the first Super Admin without printing secrets.
- [ ] Implement and run database verification for tables, functions, RLS, indexes, and migration version.
- [ ] Commit with `git commit -m "chore: add secure bootstrap and sample fixtures"`.

### Task 15: End-to-End Verification, Documentation, and Handoff

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/auth.spec.ts`
- Create: `tests/e2e/timekeeper-scan.spec.ts`
- Create: `tests/e2e/admin.spec.ts`
- Create: `tests/e2e/super-admin.spec.ts`
- Create: `README.md`
- Create: `docs/operations/timekeeper-guide.md`
- Create: `docs/operations/admin-guide.md`
- Create: `docs/operations/deployment.md`
- Modify: `PROJECT_ROADMAP.md`

**Interfaces:**
- Produces: reproducible project setup, operations, deployment, and acceptance documentation.

- [ ] Write browser tests for username login, role redirects, site/action selection, mocked camera/GPS scan boundaries, attendance review, user management authorization, and export authorization.
- [ ] Run Playwright tests and confirm they fail before the complete UI/test harness is connected.
- [ ] Add deterministic test fixtures and complete the minimum integration wiring required for the scenarios.
- [ ] Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, and `pnpm build`; expect all to pass without warnings.
- [ ] Run the application and inspect login, Timekeeper, Admin, and Super Admin pages at desktop and tablet widths.
- [ ] Verify the live Supabase migration, RLS policies, functions, and sample/master records.
- [ ] Verify the generated `.xlsx` file visually and structurally.
- [ ] Complete the README and role-specific operations/deployment guides.
- [ ] Mark implemented roadmap items and document deliberately deferred items.
- [ ] Commit with `git commit -m "docs: complete attendance system handoff"`.
