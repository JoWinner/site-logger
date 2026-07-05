# Site-Scoped Ledgers and Exports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Mapbox and Crew, enforce one assigned site per Timekeeper, add flexible employee Current Site grouping, provide searchable/sortable/filterable site ledgers, and create role-scoped date-range CSV/XLSX attendance exports.

**Architecture:** A forward Supabase migration adds `profiles.assigned_site_id` and `employees.current_site_id`, moves attendance site choice entirely into the authenticated database path, removes obsolete Mapbox columns/functions, and removes `employees.crew`. Persistent ledger controls use validated URL query parameters and server-side filters; shared grouping components render responsive tables by site. One export query service applies the same role/site/date authorization before serializing CSV or XLSX.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Supabase PostgreSQL/RLS, Zod 4, ExcelJS 4, Vitest, Testing Library, Playwright.

## Global Constraints

- Timekeepers have exactly one assigned active site and cannot choose another site while scanning or exporting.
- Frank is backfilled to `ATLAS`.
- Employee Current Site is nullable organizational metadata and never restricts QR attendance.
- Andre Cole and Luis Rivera are backfilled to Atlas; Daniel Reyes and Marcus Hill remain unassigned.
- GPS capture remains mandatory, but Mapbox, place names, maps, and GPS export/table columns are removed.
- Overtime Check remains visible, editable, filterable, and exported.
- Crew is removed from employee schema, forms, imports, and UI.
- Attendance tables and exports omit Employee ID/PIN, GPS, Assignment Check, Payroll Status, and Notes.
- All role and site restrictions are enforced server-side and in RLS/functions.
- Existing migration history is immutable; removal uses a new forward migration.

---

### Task 1: Add Database Contract and Security Migration

**Files:**
- Create: `supabase/migrations/20260705000554_site_scoped_ledgers.sql`
- Create: `supabase/tests/site_scoped_ledgers.sql`
- Modify: `supabase/tests/attendance_schema.sql`
- Modify: `lib/database.types.ts`

**Interfaces:**
- Produces: `ProfileRow.assigned_site_id: string | null`
- Produces: `EmployeeRow.current_site_id: string | null`
- Removes: `EmployeeRow.crew` and Mapbox location-resolution fields/functions
- Produces: `record_attendance_scan(...)` without `p_site_id`

- [x] **Step 1: Create the migration through the Supabase CLI**

Run:

```powershell
npx.cmd supabase migration new site_scoped_ledgers
```

Expected: one timestamped SQL file under `supabase/migrations/`.

- [ ] **Step 2: Write failing SQL contract assertions**

Add assertions proving:

```sql
-- Frank must be attached to Atlas.
select p.username, s.site_code
from public.profiles p
join public.sites s on s.id = p.assigned_site_id
where p.username = 'frank';

-- Public scan wrapper has no client-controlled site argument.
select pg_get_function_identity_arguments(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'record_attendance_scan';

-- Mapbox resolver and Crew must be absent.
select to_regprocedure(
  'public.resolve_attendance_location(uuid,text,text,timestamptz)'
);
```

The test raises when Frank is not assigned to Atlas, `p_site_id` remains,
`employees.crew` remains, or Mapbox columns/functions remain.

- [ ] **Step 3: Run the SQL test against the current schema and verify RED**

Run the assertions with the Supabase SQL test workflow.

Expected: FAIL because assignment columns do not exist and old fields remain.

- [ ] **Step 4: Implement the forward migration**

The migration must:

```sql
alter table public.profiles
  add column assigned_site_id uuid references public.sites(id) on delete restrict;

alter table public.employees
  add column current_site_id uuid references public.sites(id) on delete set null;

create index profiles_assigned_site_idx
  on public.profiles (assigned_site_id);
create index employees_current_site_idx
  on public.employees (current_site_id);
```

It backfills the approved records, adds the role/assignment check constraint,
drops `crew`, removes the Mapbox resolver/policies/columns, recreates the
private scan mutation without `p_site_id`, derives the site from the active
Timekeeper profile, and prevents cross-site Check Out. The public wrapper
remains security-invoker and executable only by `authenticated`.

- [ ] **Step 5: Update generated TypeScript database contracts**

Use:

```ts
export interface ProfileRow {
  assigned_site_id: string | null;
}

export interface EmployeeRow {
  current_site_id: string | null;
}
```

Remove `crew`, `LocationResolutionStatus`, location-resolution fields, and
`resolve_attendance_location`. Remove `p_site_id` from scan RPC arguments.

- [ ] **Step 6: Verify SQL contract and TypeScript**

Run:

```powershell
pnpm.cmd typecheck
```

Expected: SQL assertions pass after migration and TypeScript reports the
application call sites that still require updates.

- [ ] **Step 7: Commit**

```powershell
git add supabase lib/database.types.ts
git commit -m "feat: add site-scoped attendance data model"
```

---

### Task 2: Enforce Timekeeper Site Assignment in User and Scan Workflows

**Files:**
- Modify: `lib/validation/app-user.ts`
- Modify: `lib/auth/admin-users.ts`
- Modify: `app/(protected)/super-admin/users/page.tsx`
- Modify: `app/(protected)/super-admin/users/user-form.tsx`
- Modify: `app/api/scans/route.ts`
- Modify: `lib/validation/scan.ts`
- Modify: `app/(protected)/timekeeper/page.tsx`
- Modify: `app/(protected)/timekeeper/scan-console.tsx`
- Test: `tests/unit/auth/admin-users.test.ts`
- Test: `tests/unit/components/user-form.test.tsx`
- Test: `tests/unit/api/scans-location.test.ts`

**Interfaces:**
- Produces: `assignedSiteId: string | null` in create/update user inputs
- Produces: `ScanConsole({ site }: { site: SiteRow | null })`
- Removes: browser `siteId` from scan request JSON

- [ ] **Step 1: Write failing validation and UI tests**

Cover:

```ts
expect(createAppUserSchema.safeParse({
  username: "keeper",
  displayName: "Keeper",
  password: "long-password",
  role: "timekeeper",
  assignedSiteId: null,
}).success).toBe(false);

expect(createAppUserSchema.parse({
  username: "admin",
  displayName: "Admin",
  password: "long-password",
  role: "admin",
  assignedSiteId: null,
}).assignedSiteId).toBeNull();
```

Render `UserForm` with active sites and prove the site selector is required
only for Timekeeper. Assert scan request bodies contain no `siteId`.

- [ ] **Step 2: Run focused tests and verify RED**

```powershell
pnpm.cmd exec vitest run tests/unit/auth/admin-users.test.ts tests/unit/components/user-form.test.tsx tests/unit/api/scans-location.test.ts
```

Expected: FAIL because site assignment is unsupported and scan sends `siteId`.

- [ ] **Step 3: Implement site-aware user creation and editing**

Validate the selected site through the server-only Admin client. Write
`assigned_site_id`, include it in audits, clear it for non-Timekeepers, and
pass active sites plus existing assignments into `UserForm`.

- [ ] **Step 4: Lock the Timekeeper scan page to one site**

Load only `profile.assigned_site_id`. Render a read-only site panel. When no
active assignment exists, render `site_assignment_required` guidance and do
not enable GPS/camera scanning.

- [ ] **Step 5: Remove client-controlled site from scanning**

Remove `siteId` from Zod and JSON. Call the new RPC signature. Add
`site_assignment_required` to scan error mapping.

- [ ] **Step 6: Verify GREEN and commit**

```powershell
pnpm.cmd exec vitest run tests/unit/auth/admin-users.test.ts tests/unit/components/user-form.test.tsx tests/unit/api/scans-location.test.ts
git add app lib tests
git commit -m "feat: enforce timekeeper site assignments"
```

---

### Task 3: Add Flexible Employee Current Site and Remove Crew

**Files:**
- Modify: `lib/validation/employee.ts`
- Modify: `app/(protected)/admin/employees/employee-form.tsx`
- Modify: `app/api/admin/employees/route.ts`
- Modify: `app/api/admin/employees/[id]/route.ts`
- Modify: `lib/imports/headers.ts`
- Modify: `lib/imports/classify.ts`
- Modify: `lib/imports/types.ts`
- Modify: `components/imports/import-preview.tsx`
- Modify: `components/admin/employee-ledger.tsx`
- Modify: `app/(protected)/admin/employees/page.tsx`
- Test: employee form, import, API, and ledger tests

**Interfaces:**
- Produces: `EmployeeInput.currentSiteId: string | null`
- Removes: `EmployeeInput.crew`
- Import accepts `Site Code`, `Site Name`, or blank

- [ ] **Step 1: Write failing tests**

Assert employee parsing returns `currentSiteId`, never returns `crew`, imports
resolve a known site, unknown sites become row errors, and the form includes a
Current Site selector but no Crew field.

- [ ] **Step 2: Verify RED**

```powershell
pnpm.cmd exec vitest run tests/unit/imports tests/unit/components/employee-form.test.tsx tests/unit/components/employee-ledger.test.tsx
```

- [ ] **Step 3: Implement employee form/API changes**

Pass active sites to create/edit forms, store `current_site_id`, and remove all
Crew inputs, payloads, columns, and audit values. Do not reference Current Site
from the scan path.

- [ ] **Step 4: Implement import resolution**

The preview route loads sites once and passes them into classification. Match
normalized Site Code first, then unique normalized Site Name. Emit
`Unknown site` or `Ambiguous site name` as row errors. Commit uses resolved
UUIDs.

- [ ] **Step 5: Verify GREEN and commit**

```powershell
pnpm.cmd exec vitest run tests/unit/imports tests/unit/components/employee-form.test.tsx tests/unit/components/employee-ledger.test.tsx
git add app components lib tests
git commit -m "feat: group employees by flexible current site"
```

---

### Task 4: Build Shared Search, Sort, Filter, and Site Grouping

**Files:**
- Create: `lib/tables/query-state.ts`
- Create: `components/data/ledger-toolbar.tsx`
- Create: `components/data/site-ledger-groups.tsx`
- Modify: employee, site, attendance, users, bulk badge, and import preview surfaces
- Modify: `app/globals.css`
- Test: `tests/unit/tables/query-state.test.ts`
- Test: component ledger tests

**Interfaces:**
- Produces: `parseLedgerQuery(searchParams, definition)`
- Produces: `LedgerToolbar`
- Produces: `groupBySite(rows, sites, getSiteId)`

- [ ] **Step 1: Write failing query-state tests**

Prove unknown sort keys fall back safely, direction accepts only `asc|desc`,
search is trimmed, repeated site IDs are deduplicated, and reversed dates are
rejected.

- [ ] **Step 2: Verify RED**

```powershell
pnpm.cmd exec vitest run tests/unit/tables/query-state.test.ts
```

- [ ] **Step 3: Implement query-state parsing and toolbar**

Use whitelisted definitions per ledger. Toolbar updates URL parameters,
preserves unrelated parameters, provides Clear, and uses labeled native
controls with 48px mobile targets.

- [ ] **Step 4: Implement site grouping**

Group filtered results by `site_id` or `current_site_id`, order groups by site
name, and append Unassigned only for employees. Render each group as a
collapsible section with count and its own ResponsiveTable.

- [ ] **Step 5: Integrate all ledgers**

Apply controls to employees, sites, attendance, users, bulk QR, and import
preview. Import preview uses local state; persistent pages use URL/server
queries. Keep mobile card rendering and prevent page-level horizontal overflow.

- [ ] **Step 6: Verify GREEN and commit**

```powershell
pnpm.cmd exec vitest run tests/unit/tables tests/unit/components
git add app components lib tests
git commit -m "feat: add searchable grouped ledgers"
```

---

### Task 5: Simplify Attendance Ledgers and Add Timekeeper Attendance Page

**Files:**
- Modify: `lib/attendance/ledger.ts`
- Modify: `components/attendance/attendance-ledger.tsx`
- Modify: `components/attendance/attendance-preview-dialog.tsx`
- Modify: `components/attendance/location-evidence.tsx`
- Modify: `app/(protected)/admin/attendance/page.tsx`
- Create: `app/(protected)/timekeeper/attendance/page.tsx`
- Modify: `lib/auth/permissions.ts`
- Modify: `app/(protected)/timekeeper/page.tsx`
- Test: attendance ledger, permissions, and page tests

**Interfaces:**
- Produces: role-aware `loadAttendanceLedger` filters
- Produces: `/timekeeper/attendance`
- Removes: Mapbox labels/maps and forbidden attendance table columns

- [ ] **Step 1: Write failing table and permission tests**

Assert attendance rows show exactly the approved ten data columns plus Preview,
Timekeeper navigation includes Attendance, site groups are separate, and a
Timekeeper query requires both assigned site and recorder ID.

- [ ] **Step 2: Verify RED**

```powershell
pnpm.cmd exec vitest run tests/unit/components/attendance-ledger.test.tsx tests/unit/attendance/ledger.test.ts tests/unit/auth/permissions.test.ts
```

- [ ] **Step 3: Implement simplified attendance data**

Remove location decoration. Keep profile-name decoration. Add explicit
site/recorder/date/search/status/overtime/sort filters before pagination.

- [ ] **Step 4: Implement Admin and Timekeeper pages**

Admin supports multi-site filters and grouped tables. Timekeeper uses its
assigned site and recorder scope. Recent Scans reuses the compact table with a
small limit; the full page owns export controls.

- [ ] **Step 5: Keep raw GPS only in evidence detail**

Remove maps and location names but retain coordinate/accuracy presentation in
preview/detail. Omit Employee ID/PIN, Assignment, Payroll, Notes, and GPS from
ledger rows.

- [ ] **Step 6: Verify GREEN and commit**

```powershell
pnpm.cmd exec vitest run tests/unit/components/attendance-ledger.test.tsx tests/unit/attendance/ledger.test.ts tests/unit/auth/permissions.test.ts
git add app components lib tests
git commit -m "feat: add site-grouped attendance pages"
```

---

### Task 6: Create Authorized Date-Range CSV and XLSX Exports

**Files:**
- Create: `lib/exports/attendance-query.ts`
- Create: `lib/exports/attendance-csv.ts`
- Modify: `lib/exports/attendance-workbook.ts`
- Modify: `app/api/exports/attendance.xlsx/route.ts`
- Create: `app/api/exports/attendance.csv/route.ts`
- Create: `components/attendance/export-controls.tsx`
- Test: workbook, CSV, query authorization, and route tests

**Interfaces:**
- Produces: ten-column `AttendanceExportRow`
- Produces: `loadAuthorizedAttendanceExport(profile, params)`
- Produces: CSV and one-sheet-per-site XLSX

- [ ] **Step 1: Write failing export tests**

Assert exact headers:

```ts
[
  "Date", "Employee Name", "Job Site", "Check In", "Check Out",
  "Hours", "Check In By", "Check Out By", "Overtime Check",
  "Attendance Status",
]
```

Assert reversed/missing dates fail, Admin site IDs are required and
deduplicated, Timekeeper-supplied site IDs are ignored, CSV sorts by site/date,
and XLSX creates one worksheet per selected site.

- [ ] **Step 2: Verify RED**

```powershell
pnpm.cmd exec vitest run tests/unit/exports tests/unit/api/exports
```

- [ ] **Step 3: Implement one authorized query service**

Validate `from`, `to`, and `site` query parameters. Admin/Super Admin use
selected site IDs. Timekeeper derives site and recorder from profile. Reject
more than 10,000 rows.

- [ ] **Step 4: Implement CSV and revised XLSX**

Use UTF-8 CSV escaping. Build XLSX worksheets with safe unique 31-character
names, per-site tables, frozen headers, autofilters, and the ten approved
columns. Remove all obsolete formatter/types.

- [ ] **Step 5: Implement export controls**

Require From/To. Admin offers multi-select sites; Timekeeper shows locked site.
Generate role-appropriate CSV/XLSX URLs only after valid input.

- [ ] **Step 6: Verify GREEN and commit**

```powershell
pnpm.cmd exec vitest run tests/unit/exports tests/unit/api/exports
git add app components lib tests
git commit -m "feat: add scoped attendance CSV and XLSX exports"
```

---

### Task 7: Add Site Overview and Remove Mapbox Everywhere

**Files:**
- Modify: `app/(protected)/admin/page.tsx`
- Delete: `lib/location/mapbox.ts`
- Delete: Mapbox types/tests and `app/api/maps/static/route.ts`
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `PROJECT_ROADMAP.md`
- Modify: `docs/operations/*.md`
- Test: overview and absence checks

**Interfaces:**
- Produces: site overview cards with employee counts, Timekeepers, today sessions
- Removes: all active Mapbox runtime/configuration references

- [ ] **Step 1: Write failing overview tests**

Assert Atlas shows its active Current Site employees, Frank appears as its
Timekeeper, and Unassigned appears only when its active employee count exceeds
zero.

- [ ] **Step 2: Verify RED**

```powershell
pnpm.cmd exec vitest run tests/unit/components/overview.test.tsx
```

- [ ] **Step 3: Implement overview aggregation**

Load active sites, active employees, active Timekeepers, and today's sessions.
Aggregate by site ID without N+1 queries. Render one responsive summary per site
and one conditional Unassigned summary.

- [ ] **Step 4: Remove Mapbox code and documentation**

Delete runtime routes/adapters/tests, remove env vars, remove all Mapbox setup
copy, and document raw GPS retention plus the new site-scoped workflows.
Historical design/plan documents remain as historical records.

- [ ] **Step 5: Verify absence and commit**

```powershell
rg -n "MAPBOX|Mapbox|mapbox" app components lib tests .env.example README.md docs/operations PROJECT_ROADMAP.md
pnpm.cmd exec vitest run tests/unit/components/overview.test.tsx
git add -A
git commit -m "feat: add site overview and remove Mapbox"
```

Expected `rg`: no active runtime/configuration references.

---

### Task 8: Deploy Migration, Audit Security, and Complete QA

**Files:**
- Modify only when verification reveals a scoped defect.

**Interfaces:**
- Consumes all prior tasks.
- Produces a deployed, verified, pushed branch.

- [ ] **Step 1: Apply the migration to project `jbdzjguihkzdigicmxpx`**

Use the Supabase migration workflow once the SQL file is final. Verify local
and remote migration versions match.

- [ ] **Step 2: Run live database assertions**

Verify Frank→Atlas, employee backfills, Crew/Mapbox removal, RPC signatures,
anon denial, authenticated execution, cross-site Check Out denial, and RLS.

- [ ] **Step 3: Run Supabase advisors**

Run security and performance advisors. Fix new security warnings and missing
foreign-key indexes. Treat unused-index notices on a small test dataset as
informational.

- [ ] **Step 4: Run the complete automated verification**

```powershell
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd test
pnpm.cmd build
pnpm.cmd test:e2e
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 5: Run authenticated browser QA**

Verify 390px, 820px, and 1440px widths for user creation, employee groups,
attendance groups, filters/sorting, Timekeeper Recent Scans and Attendance,
multi-site Admin export controls, assigned-site Timekeeper export controls, and
no document-level horizontal overflow.

- [ ] **Step 6: Scan for secrets and removed fields**

```powershell
git grep -n -E "sb_secret_|MAPBOX_ACCESS_TOKEN|CodexQA-Temporary"
rg -n "crew|checkInGps|checkOutGps|employeeIdPin|assignmentCheck|payrollStatus|notes" lib/exports app/api/exports
```

Expected: no secrets/Mapbox config and no forbidden export fields.

- [ ] **Step 7: Commit final QA fixes and push**

```powershell
git add -A
git commit -m "chore: complete site ledger verification"
git push origin codex/operations-upgrade
```
