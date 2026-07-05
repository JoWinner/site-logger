# Site-Scoped Timekeepers and Mapbox Removal Design

## Goal

Assign every Timekeeper to exactly one construction site, prevent Timekeepers
from recording attendance for other sites, and show each Timekeeper only the
attendance sessions they personally recorded at their assigned site. Remove
the Mapbox integration while preserving raw GPS evidence. Organize employees
and attendance by site, add reusable search/sort/filter controls, and provide
date-ranged CSV/XLSX exports for Admins and Timekeepers.

## Confirmed Decisions

- Every active Timekeeper is assigned to exactly one active site.
- Frank is assigned to the site with code `ATLAS`.
- Admins and Super Admins are not assigned to sites.
- The Timekeeper scan interface has no site selector.
- Admin and Super Admin attendance interfaces continue to show all sites.
- A Timekeeper sees a session when they recorded its Check In or Check Out,
  provided the session belongs to their assigned site.
- Multiple Timekeepers may be assigned to the same site.
- A Timekeeper at a site may check out a session opened by another Timekeeper
  assigned to that same site.
- GPS latitude, longitude, capture time, and accuracy remain required.
- Mapbox place names, feature identifiers, static maps, API calls, environment
  variables, and storage are removed.
- Employees have one nullable, editable **Current Site** used only for
  organization and reporting.
- An employee's Current Site never restricts where their QR badge can be
  scanned.
- Employee `crew` data is removed from the database, forms, imports, and UI.
- Employee and attendance ledgers are grouped into separate site sections.
- Every multi-record operational table has search, sorting, and relevant
  filters.
- Admins and Super Admins may export one or multiple selected sites for a
  required date range.
- Timekeepers may export only records they personally recorded at their
  assigned site.
- Overtime Check remains available and exported.

## Architecture

The site assignment lives on `public.profiles` as `assigned_site_id`, a
foreign key to `public.sites(id)`. This is the smallest model that represents
the approved one-Timekeeper-to-one-site rule. A many-to-many assignment table
is deliberately excluded because Timekeepers do not operate across multiple
sites.

Authorization is enforced in three layers:

1. The Super Admin user API validates that Timekeepers have a site and that
   Admins and Super Admins do not.
2. The scan endpoint derives the site from the authenticated profile rather
   than accepting a site chosen by the browser.
3. PostgreSQL functions and Row Level Security verify the authenticated
   Timekeeper, assigned site, attendance site, and record ownership.

The browser filter is therefore a usability optimization, not the security
boundary.

Employee Current Site is intentionally not part of scan authorization.
Attendance always records the site of the Timekeeper who captured the event,
regardless of the employee's organizational Current Site.

Table state is represented by URL query parameters. Search, sort, filter,
pagination, selected sites, and date ranges therefore survive refreshes and
operate on the full server query instead of only the rows currently rendered.

## Profile Data Model

Add the nullable column:

```sql
assigned_site_id uuid references public.sites(id) on delete restrict
```

Add a database constraint with these states:

| Role | Required assignment |
|---|---|
| `timekeeper` | `assigned_site_id is not null` |
| `admin` | `assigned_site_id is null` |
| `super_admin` | `assigned_site_id is null` |

Add an index on `profiles(assigned_site_id)` for site-membership checks.

The migration backfills the existing active Timekeeper whose username is
`frank` to the site whose code is `ATLAS` before enabling the constraint. The
migration fails instead of silently assigning an incorrect site if Frank or
Atlas exists but the relationship cannot be established.

## Employee Current Site

Add the nullable column:

```sql
current_site_id uuid references public.sites(id) on delete set null
```

Add an index on `employees(current_site_id)`. Remove the `crew` column in the
same forward migration after application code and import contracts no longer
depend on it.

Current Site behavior:

- Admins and Super Admins select a Current Site when creating or editing an
  employee.
- Current Site may be left blank, producing the **Unassigned** employee group.
- Moving an employee means editing this value; no historical assignment table
  is created.
- Changing Current Site does not rewrite previous attendance sessions.
- Scan functions do not read or enforce `current_site_id`.
- CSV/XLSX employee imports accept Site Code or Site Name and no longer accept
  Crew.
- An unknown imported site is a row-level validation error.

Existing employee backfill:

| Employee | Current Site |
|---|---|
| Andre Cole | Atlas |
| Luis Rivera | Atlas |
| Daniel Reyes | Unassigned |
| Marcus Hill | Unassigned |

## Shared Ledger Controls

Every multi-record operational ledger or selection table receives a consistent
toolbar with:

- text search
- an explicit sort field and ascending/descending direction
- filters relevant to that dataset
- a clear/reset action
- result count and empty state

The covered surfaces are:

- employee ledgers
- site ledger
- attendance ledgers
- Super Admin user/access ledger
- bulk QR employee selection
- import preview tables

Relevant filters include:

| Surface | Search | Filters | Sorts |
|---|---|---|---|
| Employees | name, Employee ID/PIN, trade | Current Site, active state | name, site, trade, updated date |
| Sites | name, site code | active state | name, code, updated date |
| Attendance | employee, Timekeeper | site, date range, status, overtime state | date, employee, site, Check In, hours |
| Users | display name, username | role, assigned site, active state | display name, role, site, updated date |
| Bulk QR | name, Employee ID/PIN, trade | Current Site, active state | name, site, trade |
| Import preview | row values and validation messages | new, update, warning, error | row number, disposition, name/code |

Desktop tables use sortable headers or the toolbar sort control. Mobile keeps
the existing card transformation and exposes sorting through the toolbar so no
horizontal table interaction is required.

## Site-Grouped Employee Ledgers

The Employee page renders one collapsible ledger section for every site
represented by the current filtered result, plus an **Unassigned** section.
Each section shows the site name and matching employee count. Search, filter,
and sort apply before grouping.

Employee rows contain Status, Employee, Employee ID/PIN, Current Site, Trade /
Role, Updated, and Actions. Crew is absent.

## Super Admin User Management

The create and edit forms receive active sites from the server.

- Selecting `Timekeeper` reveals a required **Assigned site** field.
- Selecting `Admin` or `Super Admin` hides the field and submits `null`.
- Existing Timekeeper rows show their assigned site in the access ledger.
- Changing a Timekeeper to another role clears their assignment.
- Changing an Admin or Super Admin to Timekeeper requires selecting a site.
- Deactivating a Timekeeper preserves the assignment for auditability and
  predictable reactivation.

The create/update validation schemas accept `assignedSiteId`. Server-side
validation requires a UUID for Timekeepers and `null` for all other roles.
The application verifies that the selected site exists and is active before
writing the profile.

User audit entries include the previous and new site assignment alongside the
role and active status.

An active site cannot be deactivated while active Timekeepers are assigned to
it. A Super Admin must first reassign or deactivate those Timekeepers. This
keeps every active Timekeeper attached to an active operating site.

## Timekeeper Scan Flow

1. The Timekeeper signs in.
2. The protected page loads the Timekeeper profile and assigned active site.
3. The page displays the site code and name as locked context.
4. The Timekeeper selects Check In or Check Out.
5. The browser captures fresh GPS evidence.
6. The Timekeeper scans the employee QR badge.
7. The scan request submits the QR token, action, GPS evidence, timestamps,
   and idempotency key. It does not submit a site ID.
8. The database derives the site from the authenticated profile.
9. The result displays the employee, assigned site, action, and time.

If the Timekeeper has no assignment, has a non-Timekeeper role, is inactive,
or is assigned to an inactive site, scanning is blocked with a clear message
and the database returns `site_assignment_required`.

The Scan page's Recent Scans area uses the shared compact Attendance table
instead of a special record-card layout on desktop and tablet. It remains
responsive on phones.

## Timekeeper Attendance Page

Add `/timekeeper/attendance` and a corresponding navigation item. The page
contains:

- the assigned site as locked context
- search by employee
- status and overtime filters
- From and To date filters
- date/employee/time/hours sorting
- site-grouped attendance table
- CSV and XLSX export actions

The page and export endpoint both scope rows to:

```text
site_id = profile.assigned_site_id
AND (check_in_by = profile.id OR check_out_by = profile.id)
```

The Timekeeper cannot submit site IDs to broaden this scope.

## Attendance Session Rules

Check In:

- The assigned site is written to the immutable event and new session.
- An employee with any open session remains ineligible for another Check In.

Check Out:

- The function finds an open session for the employee at the Timekeeper's
  assigned site.
- An open session at another site is not closed and the result is
  `no_open_session`.
- The Check Out event uses the same assigned site as the session.

This prevents an event from one site being attached to a session from another
site.

## Timekeeper Attendance Visibility

The Timekeeper page explicitly queries:

- `site_id = profile.assigned_site_id`
- and either `check_in_by = profile.id` or `check_out_by = profile.id`

The database RLS policy enforces the same predicate. Admins and Super Admins
retain organization-wide attendance access.

The Timekeeper table continues to show complete sessions. When different
Timekeepers at the same site record Check In and Check Out, each recorder can
see that session because each participated in it.

Reassigning a Timekeeper changes their table to the new site's records.
Attendance they previously recorded at another site remains preserved and
visible to Admins and Super Admins, but no longer appears in that Timekeeper's
operational table. This prevents historical records from different sites being
mixed in the current site workflow.

Manual fields remain editable by a Timekeeper only on sessions where they
recorded Check In or Check Out. Admins and Super Admins retain existing access.

## Site-Grouped Attendance Ledgers

Admin and Super Admin attendance pages render a separate collapsible ledger
section for each selected site. Timekeeper attendance renders only its assigned
site section. Search, date range, status, overtime, sorting, and pagination are
applied by the server before grouping.

Attendance table rows contain only:

- Date
- Employee Name
- Job Site
- Check In
- Check Out
- Hours
- Check In By
- Check Out By
- Overtime Check
- Attendance Status
- Preview action

The following values are excluded from attendance tables:

- Employee ID/PIN
- Check In GPS
- Check Out GPS
- Assignment Check
- Payroll Status
- Notes

Employee ID/PIN remains part of employee master data. GPS remains required
evidence and may be shown in the attendance detail/preview. Assignment Check,
Payroll Status, and Notes remain stored and manually editable but are excluded
from ledgers and exports. Overtime Check remains visible and editable.

## Attendance Exports

Both CSV and XLSX exports require a valid inclusive From/To date range.

Admin and Super Admin:

- select one or multiple active/inactive sites
- export only rows from the selected sites and date range
- may not submit an empty site selection

Timekeeper:

- cannot select sites
- automatically uses their assigned site
- exports only sessions where they recorded Check In or Check Out
- uses the same From/To date contract

Both formats contain the same ten columns, in this order:

1. Date
2. Employee Name
3. Job Site
4. Check In
5. Check Out
6. Hours
7. Check In By
8. Check Out By
9. Overtime Check
10. Attendance Status

XLSX creates one worksheet per selected site, with safe unique worksheet
names. CSV emits one dataset sorted by Site, Date, and Check In because CSV
cannot contain multiple worksheets. Filenames include the date range and,
when one site is selected, the site code.

Export endpoints validate role, allowed site scope, dates, and the maximum
10,000-row limit on the server. Invalid or reversed dates return a clear
validation error.

## Overview by Site

The Admin overview replaces the single Active Employees total with one summary
section per active site. Each site shows:

- active employees whose Current Site matches the site
- assigned active Timekeeper names
- attendance sessions for the current day

An **Unassigned** summary appears when active employees have no Current Site.
The organization-wide Active Sites and Sessions Today totals remain available.

## Mapbox Removal

Remove application code and configuration:

- `lib/location/mapbox.ts`
- Mapbox location types
- reverse-geocoding calls from the scan endpoint and ledger loader
- `/api/maps/static`
- Mapbox environment variables
- Mapbox unit and route tests
- map availability props and static-map rendering
- Mapbox setup and retention documentation

Add a forward-only database migration that removes:

- `resolve_attendance_location`
- location-resolution update policies and grants
- Mapbox feature-ID, label, resolution-status, and resolution-time columns
- location-resolution triggers or trigger exceptions

Previously applied migrations remain in version control. They are not edited
or deleted because production migration history is immutable; the new
migration reverses the obsolete Mapbox schema safely.

Attendance detail and preview surfaces may continue to show raw coordinates
and accuracy for Check In and Check Out. Attendance ledgers and CSV/XLSX
exports show no GPS columns. No external map or place-name provider is used.

## Error Handling

| Condition | Result |
|---|---|
| Timekeeper has no assigned site | `site_assignment_required` |
| Assigned site is inactive or missing | `site_assignment_required` |
| Browser attempts to choose another site | No site field is accepted; database uses profile assignment |
| Employee has an open session at another site | `no_open_session` for Check Out |
| Imported employee references an unknown site | Row-level import error |
| Export has no sites, invalid dates, or reversed dates | Validation error; no file generated |
| GPS is missing or stale | Existing `gps_required` behavior |
| QR is invalid or revoked | Existing QR error behavior |

## Security

- `assigned_site_id` is controlled only through the server-side Super Admin
  workflow.
- Timekeepers cannot update their profiles or assignments.
- The public scan wrapper remains `SECURITY INVOKER`.
- The privileged mutation remains in the unexposed `private` schema and checks
  `auth.uid()`, active profile status, role, and assignment.
- Anonymous users receive no execute or table privileges.
- RLS policies use `TO authenticated`, `(select auth.uid())`, assignment
  predicates, and indexed columns.
- The service-role key remains server-only.

## Testing

Automated tests cover:

- user validation requiring a site only for Timekeepers
- create/update audit entries containing site assignments
- Super Admin forms showing and clearing the site selector by role
- prevention of site deactivation while active Timekeepers are assigned
- employee Current Site create, edit, import, grouping, and reassignment
- proof that Current Site never restricts scanning
- Crew removal from schemas, forms, imports, tables, and types
- shared search/sort/filter URL parsing and whitelisted query construction
- site-grouped employee and attendance ledgers
- site-grouped Overview counts and Timekeeper names
- Timekeeper page loading only the assigned site
- dedicated Timekeeper Attendance navigation, filters, and exports
- compact Recent Scans table
- scan requests omitting client-selected site IDs
- database scan rejection without an assignment
- database scan derivation of the assigned site
- prevention of cross-site Check Out
- Timekeeper ledger queries filtered by recorder and assigned site
- Admin attendance remaining organization-wide
- Admin multi-site and Timekeeper single-site export authorization
- date-range validation for CSV and XLSX
- identical ten-column CSV/XLSX contracts
- one XLSX worksheet per selected site
- Mapbox files, environment variables, API routes, UI copy, and dependencies
  being absent
- retained GPS coordinates and accuracy in previews and detail pages but not
  ledgers or exports

Verification includes unit/component tests, SQL assertions, Supabase security
and performance advisors, strict TypeScript, lint, production build, and
desktop/tablet/phone browser checks.

## Rollout

1. Add and test the forward migration locally.
2. Apply the migration to the `site-logger` Supabase project.
3. Verify Frank is assigned to Atlas.
4. Verify anonymous callers cannot execute attendance mutations.
5. Verify Frank can record only Atlas attendance.
6. Verify Admin and Super Admin attendance remains unfiltered.
7. Verify employee Current Site grouping and unrestricted cross-site scanning.
8. Verify Admin multi-site and Timekeeper assigned-site exports for CSV/XLSX.
9. Remove Mapbox secrets from local and Vercel configuration.
10. Deploy the application and run the documented smoke test.
