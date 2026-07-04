# Site-Scoped Timekeepers and Mapbox Removal Design

## Goal

Assign every Timekeeper to exactly one construction site, prevent Timekeepers
from recording attendance for other sites, and show each Timekeeper only the
attendance sessions they personally recorded at their assigned site. Remove
the Mapbox integration while preserving raw GPS coordinates and accuracy as
attendance evidence.

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

The attendance UI continues to show raw coordinates and accuracy for Check In
and Check Out. The attendance ledger replaces **GPS location** with compact
**GPS evidence** based on captured coordinates. No external map or place-name
provider is used.

## Error Handling

| Condition | Result |
|---|---|
| Timekeeper has no assigned site | `site_assignment_required` |
| Assigned site is inactive or missing | `site_assignment_required` |
| Browser attempts to choose another site | No site field is accepted; database uses profile assignment |
| Employee has an open session at another site | `no_open_session` for Check Out |
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
- Timekeeper page loading only the assigned site
- scan requests omitting client-selected site IDs
- database scan rejection without an assignment
- database scan derivation of the assigned site
- prevention of cross-site Check Out
- Timekeeper ledger queries filtered by recorder and assigned site
- Admin attendance remaining organization-wide
- Mapbox files, environment variables, API routes, UI copy, and dependencies
  being absent
- retained GPS coordinates and accuracy in tables, previews, detail pages, and
  exports

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
7. Remove Mapbox secrets from local and Vercel configuration.
8. Deploy the application and run the documented smoke test.
