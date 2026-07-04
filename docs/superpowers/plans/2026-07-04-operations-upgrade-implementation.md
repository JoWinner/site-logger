# Operations Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver mobile-safe ledgers, attendance quick preview, CSV/XLSX
master-data imports, Mapbox location labels, and Super Admin bulk QR badge
issuing while retaining the existing simple forms and immutable GPS evidence.

**Architecture:** Build reusable client ledger/dialog components on top of
server-prepared view models. Parse imports on the server and commit through
authorized transactional Postgres functions. Resolve GPS labels through a
server-only Mapbox adapter with separate temporary and permanent modes. Issue
bulk QR tokens transactionally and render/print QR images only in the browser.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase/Postgres,
Mapbox Geocoding API v6, ExcelJS, QRCode, Vitest, Testing Library, Playwright,
CSS media/print queries.

## Global Constraints

- Employee ID/PIN remains optional.
- Employee imports update only by Employee ID/PIN; an ID-less row is always new
  and receives a duplicate-name warning when applicable.
- Site imports update by permanent Site Code.
- Accept `.csv` and `.xlsx`, up to 5 MB and 2,000 data rows.
- Temporary Mapbox results are never persisted or cached.
- Permanent Mapbox requests use `permanent=true` and may be stored.
- GPS coordinates, device accuracy, and captured time remain primary immutable
  scan evidence; reverse geocoding never enforces site proximity.
- Mapbox tokens remain server-only.
- Mobile pages must not require page-level horizontal scrolling or pinch zoom.
- Touch targets are at least 48 px.
- Bulk QR issuing is Super Admin-only, atomic, limited to 100 employees, and
  revokes previous active badges after explicit confirmation.
- Raw QR tokens are returned once and never persisted in browser storage.

---

### Task 1: Isolate Work and Stabilize the Regression Baseline

**Files:**

- Modify: `vitest.config.ts`
- Verify: `components/app-shell/role-nav.tsx`
- Verify: `components/forms/password-field.tsx`
- Verify: `app/(protected)/super-admin/users/user-form.tsx`
- Test: `tests/unit/components/role-nav.test.tsx`
- Test: `tests/unit/components/password-visibility.test.tsx`
- Test: `tests/unit/components/user-form.test.tsx`

**Interfaces:**

- Consumes: existing active-navigation, password-toggle, and form-reset changes.
- Produces: reliable single-worker full-suite execution on constrained Windows
  environments.

- [ ] **Step 1: Create and switch to the feature branch**

Run:

```powershell
git switch -c codex/operations-upgrade
```

Expected: current branch is `codex/operations-upgrade`, including the approved
specification commit.

- [ ] **Step 2: Reproduce the full-suite worker failure**

Run:

```powershell
pnpm.cmd test
```

Expected before the test-runner fix: Vitest worker process exits with the
previous out-of-memory/unhandled-worker error, even though individual tests
pass.

- [ ] **Step 3: Bound Vitest file concurrency**

Add to `vitest.config.ts`:

```ts
test: {
  environment: "jsdom",
  setupFiles: ["./vitest.setup.ts"],
  include: ["tests/**/*.test.{ts,tsx}"],
  fileParallelism: false,
  maxWorkers: 1,
  coverage: {
    reporter: ["text", "json", "html"],
  },
},
```

- [ ] **Step 4: Verify the full baseline**

Run:

```powershell
pnpm.cmd test
pnpm.cmd typecheck
pnpm.cmd lint
```

Expected: all commands exit 0; regression tests for sidebar, password
visibility, and user creation pass.

- [ ] **Step 5: Commit**

```powershell
git add vitest.config.ts
git commit -m "test: stabilize Windows test execution"
```

---

### Task 2: Build Responsive Employee and Site Ledgers

**Files:**

- Create: `components/data/responsive-table.tsx`
- Create: `components/data/record-dialog.tsx`
- Create: `components/admin/employee-ledger.tsx`
- Create: `components/admin/site-ledger.tsx`
- Modify: `app/(protected)/admin/employees/page.tsx`
- Modify: `app/(protected)/admin/sites/page.tsx`
- Modify: `app/globals.css`
- Test: `tests/unit/components/employee-ledger.test.tsx`
- Test: `tests/unit/components/site-ledger.test.tsx`
- Test: `tests/e2e/responsive-ledgers.spec.ts`

**Interfaces:**

- Produces:

```ts
export interface ResponsiveColumn<Row> {
  key: string;
  label: string;
  render: (row: Row) => React.ReactNode;
}

export function ResponsiveTable<Row extends { id: string }>(props: {
  caption: string;
  columns: ResponsiveColumn<Row>[];
  rows: Row[];
  actions: (row: Row) => React.ReactNode;
  emptyMessage: string;
}): React.ReactNode;

export function RecordDialog(props: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}): React.ReactNode;
```

- [ ] **Step 1: Write failing ledger component tests**

Cover:

```tsx
expect(screen.getByRole("table", { name: "Employee ledger" }))
  .toBeInTheDocument();
expect(screen.getByRole("button", { name: /edit marcus hill/i }))
  .toBeInTheDocument();
expect(screen.getByRole("link", { name: /qr badge for marcus hill/i }))
  .toBeInTheDocument();
```

Site tests assert Site Code, status, updated time, and Edit action.

- [ ] **Step 2: Run tests and verify RED**

```powershell
pnpm.cmd exec vitest run tests/unit/components/employee-ledger.test.tsx tests/unit/components/site-ledger.test.tsx
```

Expected: FAIL because the ledger components do not exist.

- [ ] **Step 3: Implement shared table and dialog primitives**

Use a semantic `<table>` with `data-label` on each `<td>`. `RecordDialog` uses
native `<dialog>`, calls `showModal()` when open, closes on Escape/backdrop, and
returns focus to the triggering button.

- [ ] **Step 4: Replace employee/site `<details>` lists**

Employee columns: status, full name, optional ID/PIN, trade role, crew, updated,
actions. Site columns: status, name, Site Code, updated, actions. Keep the
single-record forms and open edit forms inside `RecordDialog`.

- [ ] **Step 5: Add mobile CSS**

At `max-width: 720px`, hide the table header and render each row as a block.
Every cell uses `::before { content: attr(data-label) }`, wraps text, and uses
the page width. Action groups use two columns when space permits and one column
at 360 px.

- [ ] **Step 6: Verify unit and responsive browser tests**

```powershell
pnpm.cmd exec vitest run tests/unit/components/employee-ledger.test.tsx tests/unit/components/site-ledger.test.tsx
pnpm.cmd exec playwright test tests/e2e/responsive-ledgers.spec.ts
```

Expected: component tests pass and Playwright finds no document-level horizontal
overflow at 360, 390, 768, and 1440 px.

- [ ] **Step 7: Commit**

```powershell
git add components/data components/admin app/(protected)/admin app/globals.css tests
git commit -m "feat: add responsive employee and site ledgers"
```

---

### Task 3: Parse and Preview CSV/XLSX Master Data

**Files:**

- Create: `lib/imports/types.ts`
- Create: `lib/imports/headers.ts`
- Create: `lib/imports/parse-workbook.ts`
- Create: `lib/imports/classify.ts`
- Create: `app/api/admin/imports/[entity]/preview/route.ts`
- Create: `components/imports/master-data-import.tsx`
- Create: `components/imports/import-preview.tsx`
- Modify: `app/(protected)/admin/employees/page.tsx`
- Modify: `app/(protected)/admin/sites/page.tsx`
- Test: `tests/unit/imports/headers.test.ts`
- Test: `tests/unit/imports/parse-workbook.test.ts`
- Test: `tests/unit/imports/classify.test.ts`
- Fixture: `tests/fixtures/imports/employees.csv`
- Fixture: `tests/fixtures/imports/employees.xlsx`
- Fixture: `tests/fixtures/imports/sites.csv`

**Interfaces:**

```ts
export type ImportEntity = "employees" | "sites";
export type ImportDisposition = "new" | "update" | "warning" | "error";

export interface ImportPreviewRow<T> {
  rowNumber: number;
  disposition: ImportDisposition;
  value: T | null;
  messages: string[];
}

export async function parseImportFile(
  file: File,
  entity: ImportEntity,
): Promise<Record<string, unknown>[]>;

export function classifyEmployeeRows(
  rows: Record<string, unknown>[],
  existing: EmployeeRow[],
): ImportPreviewRow<EmployeeInput>[];

export function classifySiteRows(
  rows: Record<string, unknown>[],
  existing: SiteRow[],
): ImportPreviewRow<SiteInput>[];
```

- [ ] **Step 1: Write failing header and parser tests**

Tests assert that `Employee ID/PIN`, `employee_id_pin`, and `Employee-ID` map to
the optional ID field; blank rows are ignored; `.csv` and first-sheet `.xlsx`
produce the same normalized data; files over 5 MB and data beyond 2,000 rows are
rejected.

- [ ] **Step 2: Verify parser tests fail**

```powershell
pnpm.cmd exec vitest run tests/unit/imports/headers.test.ts tests/unit/imports/parse-workbook.test.ts
```

Expected: FAIL because import modules do not exist.

- [ ] **Step 3: Implement safe server parsing**

Use ExcelJS `Workbook.xlsx.load(await file.arrayBuffer())` for `.xlsx` and
`Workbook.csv.read(Readable.from(await file.text()))` for `.csv`. Read calculated
cell values only. Normalize headers without evaluating formulas. Reject unknown
extension/MIME combinations, oversized files, missing required headers, and
excess rows.

- [ ] **Step 4: Write and verify failing classification tests**

Employee assertions:

```ts
expect(byId.get("E001")?.disposition).toBe("update");
expect(idlessDuplicate.disposition).toBe("warning");
expect(idlessDuplicate.value?.employeeIdPin).toBeNull();
```

Site assertions:

```ts
expect(byCode.get("ATLAS")?.disposition).toBe("update");
```

- [ ] **Step 5: Implement classification and preview endpoint**

The protected route accepts multipart form data, loads existing records through
the signed-in Supabase client, and returns normalized preview rows plus counts.
Only Admin and Super Admin roles are accepted.

- [ ] **Step 6: Implement import UI**

Add `Add one` and `Import file` tabs. Show filename, counts, a mobile-safe row
preview, row messages, replace-file action, and disabled Commit button when
errors exist.

- [ ] **Step 7: Verify**

```powershell
pnpm.cmd exec vitest run tests/unit/imports
pnpm.cmd typecheck
pnpm.cmd lint
```

Expected: all parser/classifier tests pass and no type/lint errors remain.

- [ ] **Step 8: Commit**

```powershell
git add lib/imports app/api/admin/imports components/imports app/(protected)/admin tests
git commit -m "feat: preview employee and site imports"
```

---

### Task 4: Commit Imports Atomically

**Files:**

- Create via CLI: Supabase migration named `master_data_imports`
- Modify: `lib/database.types.ts`
- Create: `app/api/admin/imports/[entity]/commit/route.ts`
- Modify: `components/imports/master-data-import.tsx`
- Test: `tests/unit/imports/commit-route.test.ts`
- Test: `supabase/tests/master_data_imports.sql`

**Interfaces:**

```sql
public.import_employees(p_rows jsonb)
returns jsonb

public.import_sites(p_rows jsonb)
returns jsonb
```

```ts
interface ImportCommitResult {
  created: number;
  updated: number;
  warnings: number;
}
```

- [ ] **Step 1: Generate the migration with the Supabase CLI**

Discover syntax first:

```powershell
pnpm.cmd exec supabase migration new --help
pnpm.cmd exec supabase migration new master_data_imports
```

Use the exact CLI-generated file for every SQL step below.

- [ ] **Step 2: Write failing database tests**

Cover Admin authorization, Timekeeper denial, employee update by
case-insensitive ID/PIN, ID-less insert, Site Code update, audit trigger
execution, and transaction rollback when one row is invalid.

- [ ] **Step 3: Run database tests and verify RED**

```powershell
pnpm.cmd exec supabase test db supabase/tests/master_data_imports.sql
```

Expected: FAIL because the import functions do not exist.

- [ ] **Step 4: Implement security-invoker import functions**

Each function:

1. Verifies `current_app_role()` is `admin` or `super_admin`.
2. Rejects non-array or more than 2,000 rows.
3. Validates required strings and field lengths.
4. Updates employees only when a non-null ID/PIN matches case-insensitively.
5. Inserts every ID-less employee.
6. Updates sites by case-insensitive Site Code.
7. Returns created/updated counts.

Do not use `SECURITY DEFINER`. Revoke default `PUBLIC` execute and grant execute
only to `authenticated`.

- [ ] **Step 5: Implement commit route and UI completion**

The route re-parses each row with `employeeInputSchema` or `siteInputSchema`,
calls the matching RPC, and returns `ImportCommitResult`. The client shows the
result, clears the staged file, and refreshes the ledger.

- [ ] **Step 6: Verify database and route tests**

```powershell
pnpm.cmd exec supabase test db supabase/tests/master_data_imports.sql
pnpm.cmd exec vitest run tests/unit/imports/commit-route.test.ts
pnpm.cmd typecheck
```

- [ ] **Step 7: Commit**

```powershell
git add supabase lib/database.types.ts app/api/admin/imports components/imports tests
git commit -m "feat: commit master data imports atomically"
```

---

### Task 5: Add Mapbox Location Evidence and Timekeeper Names

**Files:**

- Create via CLI: Supabase migration named `attendance_location_labels`
- Create: `lib/location/mapbox.ts`
- Create: `lib/location/types.ts`
- Create: `lib/attendance/ledger.ts`
- Modify: `app/api/scans/route.ts`
- Modify: `lib/database.types.ts`
- Modify: `.env.example`
- Modify: `app/(protected)/attendance/[id]/page.tsx`
- Test: `tests/unit/location/mapbox.test.ts`
- Test: `tests/unit/attendance/ledger.test.ts`
- Test: `tests/unit/api/scans-location.test.ts`
- Test: `supabase/tests/attendance_locations.sql`

**Interfaces:**

```ts
export interface ResolvedLocation {
  label: string;
  featureId: string | null;
  resolvedAt: string;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ResolvedLocation | null>;

export interface AttendanceLedgerRow extends AttendanceSessionRow {
  checkInLocationLabel: string | null;
  checkOutLocationLabel: string | null;
  checkInTimekeeperName: string | null;
  checkOutTimekeeperName: string | null;
}

export async function loadAttendanceLedger(
  supabase: SupabaseClient<Database>,
  options: { limit: number; offset?: number },
): Promise<AttendanceLedgerRow[]>;
```

- [ ] **Step 1: Write failing Mapbox adapter tests**

Mock complete Mapbox response fixtures and assert:

```ts
expect(url.searchParams.get("permanent")).toBe("true");
expect(result).toEqual({
  label: "Pokuase Station, Greater Accra, Ghana",
  featureId: "mapbox-id",
  resolvedAt: expect.any(String),
});
```

Temporary mode must omit `permanent=true`; missing token, non-OK response, or
empty features returns `null` without exposing credentials.

- [ ] **Step 2: Verify RED**

```powershell
pnpm.cmd exec vitest run tests/unit/location/mapbox.test.ts
```

- [ ] **Step 3: Implement server-only Mapbox adapter**

Read `MAPBOX_ACCESS_TOKEN` and `MAPBOX_GEOCODING_MODE`. Use the v6 reverse
endpoint, `language=en`, and select the most specific useful feature/context
label. Export no token and include no token in thrown/logged errors.

- [ ] **Step 4: Generate migration and write failing SQL tests**

```powershell
pnpm.cmd exec supabase migration new attendance_location_labels
```

Add SQL tests for nullable resolution fields, permanent scan metadata, narrow
unresolved-to-resolved transition, and rejection of changes to coordinates,
capture time, employee, site, or already-resolved labels.

- [ ] **Step 5: Implement schema and RPC changes**

Add check-in/out label, feature ID, resolution status, and resolved time fields
to events/sessions. Extend `record_attendance_scan` with nullable location
metadata. Change the immutable-event trigger to permit only empty resolution
metadata becoming resolved once.

- [ ] **Step 6: Integrate scan resolution**

After GPS validation:

```ts
const location =
  process.env.MAPBOX_GEOCODING_MODE === "permanent"
    ? await reverseGeocode(latitude, longitude)
    : null;
```

Pass permanent metadata to the RPC. A geocoding failure records the scan with
`unresolved` status and coordinates intact.

- [ ] **Step 7: Implement ledger loader**

Fetch sessions, collect unique timekeeper UUIDs, fetch matching profiles once,
and map display names before IDs. In temporary mode, reverse-geocode only the
current ledger page without caching or database writes.

- [ ] **Step 8: Update detail evidence and environment docs**

Display label, coordinates, accuracy, and `Display Name · short ID` for both
check-in and check-out. Add blank server-only Mapbox variables to `.env.example`.

- [ ] **Step 9: Verify**

```powershell
pnpm.cmd exec vitest run tests/unit/location tests/unit/attendance tests/unit/api/scans-location.test.ts
pnpm.cmd exec supabase test db supabase/tests/attendance_locations.sql
pnpm.cmd typecheck
pnpm.cmd lint
```

- [ ] **Step 10: Commit**

```powershell
git add lib/location lib/attendance app/api/scans app/(protected)/attendance lib/database.types.ts .env.example supabase tests
git commit -m "feat: add Mapbox attendance locations"
```

---

### Task 6: Add Responsive Attendance Ledger and Quick Preview

**Files:**

- Create: `components/attendance/attendance-ledger.tsx`
- Create: `components/attendance/attendance-preview-dialog.tsx`
- Create: `components/attendance/location-evidence.tsx`
- Modify: `app/(protected)/admin/attendance/page.tsx`
- Modify: `app/(protected)/timekeeper/page.tsx`
- Modify: `components/attendance/manual-fields-form.tsx`
- Modify: `components/attendance/correction-form.tsx`
- Modify: `app/globals.css`
- Test: `tests/unit/components/attendance-ledger.test.tsx`
- Test: `tests/unit/components/attendance-preview-dialog.test.tsx`
- Test: `tests/e2e/attendance-preview.spec.ts`

**Interfaces:**

```ts
export function AttendanceLedger(props: {
  rows: AttendanceLedgerRow[];
  role: AppRole;
}): React.ReactNode;

export function AttendancePreviewDialog(props: {
  session: AttendanceLedgerRow | null;
  role: AppRole;
  open: boolean;
  onClose: () => void;
}): React.ReactNode;
```

- [ ] **Step 1: Write failing interaction tests**

Cover row tap opening the dialog, Escape/close/backdrop, focus return, full-page
link, manual actions for every role, correction actions only for Admin/Super
Admin, GPS labels, coordinates, accuracy, and timekeeper display names.

- [ ] **Step 2: Verify RED**

```powershell
pnpm.cmd exec vitest run tests/unit/components/attendance-ledger.test.tsx tests/unit/components/attendance-preview-dialog.test.tsx
```

- [ ] **Step 3: Implement ledger and dialog**

Use one shared ledger on Admin/Super Admin and Timekeeper pages. A row is a
button-like interactive table row on desktop and a labelled record on mobile.
Use `AttendancePreviewDialog` for all quick actions and retain the existing
`/attendance/[id]` full page.

- [ ] **Step 4: Make forms modal-safe**

Add optional `onSaved` callbacks to manual/correction forms. On success, refresh
the router and update/close the dialog without navigating away. Preserve
original immutable scan events.

- [ ] **Step 5: Add responsive and dialog CSS**

At phone widths, use a full-height `100dvh` dialog with sticky header/footer and
internally scrolling content. Long location names and notes wrap. The page
itself has no horizontal overflow.

- [ ] **Step 6: Verify**

```powershell
pnpm.cmd exec vitest run tests/unit/components/attendance-ledger.test.tsx tests/unit/components/attendance-preview-dialog.test.tsx
pnpm.cmd exec playwright test tests/e2e/attendance-preview.spec.ts
```

Expected: all interactions pass at desktop and phone viewports; no horizontal
document overflow.

- [ ] **Step 7: Commit**

```powershell
git add components/attendance app/(protected)/admin/attendance app/(protected)/timekeeper app/globals.css tests
git commit -m "feat: add attendance quick preview ledger"
```

---

### Task 7: Add Super Admin Bulk QR Badge Desk

**Files:**

- Create via CLI: Supabase migration named `bulk_qr_badges`
- Create: `app/(protected)/super-admin/badges/page.tsx`
- Create: `components/attendance/bulk-badge-desk.tsx`
- Create: `components/attendance/printable-badge.tsx`
- Create: `app/api/super-admin/badges/bulk/route.ts`
- Create: `lib/qr/filenames.ts`
- Modify: `components/attendance/employee-badge.tsx`
- Modify: `lib/auth/permissions.ts`
- Modify: `lib/database.types.ts`
- Modify: `app/globals.css`
- Test: `tests/unit/qr/filenames.test.ts`
- Test: `tests/unit/components/bulk-badge-desk.test.tsx`
- Test: `tests/unit/api/bulk-badges.test.ts`
- Test: `supabase/tests/bulk_qr_badges.sql`
- Test: `tests/e2e/bulk-badges.spec.ts`

**Interfaces:**

```ts
export function badgePrintTitle(employeeName: string): string;

interface BulkBadgeRequest {
  employeeIds: string[];
}

interface IssuedBadge {
  employeeId: string;
  employeeName: string;
  employeeIdPin: string | null;
  rawToken: string;
}
```

```sql
public.issue_bulk_qr_badges(
  p_employee_ids uuid[],
  p_token_hashes text[]
) returns jsonb
```

- [ ] **Step 1: Write failing filename and selection tests**

Assert safe print titles, name/ID/role/crew filtering, select-all-filtered, clear,
100-record cap, confirmation requirement, and no browser-storage writes.

- [ ] **Step 2: Verify RED**

```powershell
pnpm.cmd exec vitest run tests/unit/qr/filenames.test.ts tests/unit/components/bulk-badge-desk.test.tsx
```

- [ ] **Step 3: Generate migration and write failing database tests**

```powershell
pnpm.cmd exec supabase migration new bulk_qr_badges
pnpm.cmd exec supabase test db supabase/tests/bulk_qr_badges.sql
```

Cover Super Admin-only access, duplicate IDs, more than 100 IDs, inactive
employee rollback, revocation, inserts, and one active token per employee.

- [ ] **Step 4: Implement transactional issuing**

The route generates all raw tokens and hashes server-side, sends only hashes and
IDs to the transaction function, and returns raw tokens once after success.
Neither SQL nor application logs contain raw tokens.

- [ ] **Step 5: Implement the badge desk**

Load active employees on the server. The client filters/selects, shows the
revocation confirmation, calls the bulk endpoint, generates QR data URLs
locally, and displays a print-ready grid. Add the page to Super Admin navigation.

- [ ] **Step 6: Add named printing**

The individual badge temporarily sets `document.title` to
`<Employee Name> - QR Badge`. Bulk print title is
`Employee QR Badges - YYYY-MM-DD`; each physical badge visibly contains the
employee name and optional ID/PIN.

- [ ] **Step 7: Add print/mobile CSS**

Hide all non-badge UI under `@media print`; prevent badge splitting; support A4
and Letter; use one preview column on phones and a multi-column grid on desktop.

- [ ] **Step 8: Verify**

```powershell
pnpm.cmd exec vitest run tests/unit/qr tests/unit/components/bulk-badge-desk.test.tsx tests/unit/api/bulk-badges.test.ts
pnpm.cmd exec supabase test db supabase/tests/bulk_qr_badges.sql
pnpm.cmd exec playwright test tests/e2e/bulk-badges.spec.ts
```

- [ ] **Step 9: Commit**

```powershell
git add app/(protected)/super-admin/badges app/api/super-admin/badges components/attendance lib/qr lib/auth/permissions.ts lib/database.types.ts app/globals.css supabase tests
git commit -m "feat: add bulk QR badge desk"
```

---

### Task 8: Documentation, Security Review, and Release Verification

**Files:**

- Modify: `README.md`
- Modify: `docs/operations/deployment.md`
- Modify: `docs/operations/bootstrap.md`
- Modify: `.env.example`
- Test: `tests/e2e/mobile-operations.spec.ts`

**Interfaces:**

- Consumes: all seven implementation tasks.
- Produces: documented environment setup, import templates, Mapbox mode switch,
  mobile acceptance coverage, and a push-ready branch.

- [ ] **Step 1: Document operations**

Document:

- CSV/XLSX accepted columns and matching rules
- Mapbox temporary testing limitations
- Mapbox permanent mode and server-only environment variables
- Import size/row limits
- Bulk QR revocation warning and print-before-leaving rule
- Responsive ledger and attendance preview usage

- [ ] **Step 2: Add final mobile acceptance test**

At 360, 390, 768, and 1024 px, visit employee, site, attendance, and badge pages.
Assert:

```ts
expect(await page.evaluate(
  () => document.documentElement.scrollWidth <=
    document.documentElement.clientWidth,
)).toBe(true);
```

Also verify 48 px action targets, dialog content visibility, wrapped GPS labels,
and no clipped badge controls.

- [ ] **Step 3: Run Supabase security checks**

Use current CLI help before commands:

```powershell
pnpm.cmd exec supabase db advisors --help
pnpm.cmd exec supabase db advisors
pnpm.cmd exec supabase migration list --local
```

Review that all new functions are security-invoker, `PUBLIC` execute is revoked,
role checks are explicit, and no secret is exposed through `NEXT_PUBLIC_`.

- [ ] **Step 4: Run the complete verification matrix**

```powershell
pnpm.cmd test
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd build
pnpm.cmd exec playwright test
git diff --check
git grep -n -E "sb_secret_|MAPBOX_ACCESS_TOKEN=.*[^=]$"
```

Expected: all commands exit 0; secret grep returns no committed value.

- [ ] **Step 5: Review requirement coverage**

Confirm every approved specification requirement has implementation evidence:
responsive tables, full employee actions, imports, non-overflowing attendance,
modal actions/full-page expansion, timekeeper display name, Mapbox label, GPS in
ledger, phone comfort, bulk issuing, and employee-named printing.

- [ ] **Step 6: Commit documentation**

```powershell
git add README.md docs .env.example tests/e2e/mobile-operations.spec.ts
git commit -m "docs: add operations upgrade runbook"
```

- [ ] **Step 7: Finish and push**

Invoke `superpowers:verification-before-completion`, then
`superpowers:finishing-a-development-branch`. Because the user already requested
a GitHub push, push `codex/operations-upgrade` to `origin` after fresh
verification:

```powershell
git push -u origin codex/operations-upgrade
```
