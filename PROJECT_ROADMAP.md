# QR Attendance Tracker — Project Roadmap to Completion

## Objective

Build a production-ready, installable Next.js web application for recording construction-site attendance by scanning employee QR codes. The application will use Supabase for authentication and data storage and will provide separate Timekeeper, Admin, and Super Admin interfaces.

## Delivery Status — 2026-07-04

- [x] Next.js application and all three role interfaces implemented.
- [x] Live `site-logger` Supabase schema, functions, RLS, and sample master data applied.
- [x] GPS-required QR Check In/Check Out workflow implemented and transaction-tested.
- [x] Optional Employee ID/PIN and nullable manual fields implemented.
- [x] A–P `.xlsx` export implemented, structurally tested, and visually verified.
- [x] PWA manifest, icons, service worker, and offline warning implemented.
- [x] Unit, browser, type, lint, build, and live database checks passed.
- [x] Bootstrap, Timekeeper, Admin, and Vercel handoff documentation written.
- [x] Responsive employee, site, and attendance ledgers verified at phone, tablet, and desktop widths.
- [x] CSV/XLSX employee and site import preview/commit workflows implemented.
- [x] Mapbox reverse geocoding and static attendance map evidence implemented.
- [x] Attendance quick preview, manual review, corrections, and full-history navigation implemented.
- [x] Super Admin bulk QR issue/print workflow implemented for up to 100 employees.
- [x] Live database advisor hardening applied, including private mutation functions and foreign-key indexes.
- [ ] Project owner adds Supabase and Mapbox production secrets to Vercel.
- [ ] Project owner enables Supabase leaked-password protection when the project plan supports it.
- [ ] Project owner creates the first Super Admin with the supplied bootstrap command.
- [ ] Project owner deploys the verified build to Vercel and runs the documented smoke test.

## Confirmed Requirements

- [x] Use Next.js for the web application.
- [x] Make the application installable on a PC or tablet as a Progressive Web App (PWA).
- [x] Use Supabase PostgreSQL as the database.
- [x] Use a simple username-and-password sign-in experience.
- [x] Provide Timekeeper, Admin, and Super Admin roles.
- [x] Import employees and sites once, then maintain them in the application.
- [x] Capture GPS coordinates and accuracy with every QR scan.
- [x] Record GPS information without enforcing a permitted-location radius.
- [x] Use the attendance fields demonstrated in `company_worker_attendance_check_in.xlsx`.
- [x] Provide an `.xlsx` attendance export based on the sample workbook, with the approved added fields.
- [x] Keep Employee ID/PIN optional because some employees do not have one.
- [x] Identify every employee internally with a generated UUID instead of relying on Employee ID/PIN.
- [x] Keep overtime check, assignment check, and payroll status optional.
- [x] Allow an Admin or Timekeeper to enter the optional fields manually.
- [x] Leave Vercel deployment to the project owner.

## Working Scan Flow

The approved workflow is:

1. The Timekeeper signs in.
2. The Timekeeper selects a construction site.
3. The Timekeeper selects **Check In** or **Check Out**.
4. The application requests the device's current GPS location.
5. The Timekeeper scans the employee's QR code.
6. The application validates the employee and QR token.
7. The application records the event, GPS coordinates, GPS accuracy, site, action, timestamp, and Timekeeper.
8. The interface displays a clear success, duplicate, or error result.

GPS is evidence attached to a scan. It is not used to accept or reject attendance based on distance.

## Attendance Log Contract

Supabase is the system of record. The sample workbook defines the human-readable attendance log and export shape; the application will not treat the original `.xlsx` file as a live database.

### Fields represented by the sample workbook

- `work_date`: displayed as **Date**.
- `employee_name_snapshot`: displayed as **Employee Name**.
- `employee_id_pin_snapshot`: displayed as **Employee ID / PIN** and allowed to be `NULL`.
- `site_name_snapshot`: displayed as **Job Site**.
- `check_in_at`: displayed as **Check In** and allowed to be `NULL` until Check In occurs.
- `check_out_at`: displayed as **Check Out** and allowed to be `NULL` until Check Out occurs.
- `hours`: calculated only when both Check In and Check Out are available.

### Required additions

- Check In GPS latitude, longitude, and accuracy.
- Check Out GPS latitude, longitude, and accuracy.
- Check In Timekeeper.
- Check Out Timekeeper.
- Nullable manual overtime check.
- Nullable manual assignment check.
- Nullable manual payroll status.
- Optional operational notes.
- Attendance status, such as open, complete, incomplete, or corrected.

### Proposed `.xlsx` column order

The export will use the workbook's existing A–P width:

| Column | Export heading | Source |
|---|---|---|
| A | Date | Attendance session work date |
| B | Employee Name | Employee-name snapshot |
| C | Employee ID / PIN | Optional employee ID/PIN snapshot |
| D | Job Site | Site-name snapshot |
| E | Check In | Check In timestamp |
| F | Check Out | Check Out timestamp |
| G | Hours | Calculated from Check In and Check Out |
| H | Check In GPS | Combined latitude, longitude, and accuracy |
| I | Check Out GPS | Combined latitude, longitude, and accuracy |
| J | Check In By | Check In Timekeeper |
| K | Check Out By | Check Out Timekeeper |
| L | Overtime Check | Nullable manual field |
| M | Assignment Check | Nullable manual field |
| N | Payroll Status | Nullable manual field |
| O | Notes | Optional operational notes |
| P | Attendance Status | Open, complete, incomplete, or corrected |

The database will retain GPS latitude, longitude, and accuracy as separate typed values even though the `.xlsx` export combines them for readability.

### Internal traceability fields

- Internal employee UUID.
- Internal site UUID.
- Immutable scan-event UUIDs.
- QR-token reference.
- Device-captured and server-received timestamps.
- Idempotency key.
- Created, updated, and correction audit metadata.

The employee QR code resolves to the internal employee UUID through an opaque QR token. A missing Employee ID/PIN must never block QR generation, Check In, Check Out, reporting, or export.

---

## Phase 0 — Product Decisions and Design Approval

- [ ] Confirm that the workbook is a reporting/export reference rather than live application storage.
- [ ] Confirm that the Timekeeper selects the site before scanning employees.
- [ ] Confirm that Check In and Check Out are explicit Timekeeper actions.
- [ ] Decide whether a scan must fail when GPS permission is denied or unavailable.
- [ ] Define `overtime_check` as a checkbox, number of hours, or free-text value.
- [ ] Define `assignment_check` as a checkbox, status list, or free-text value.
- [ ] Define the allowed manual values for `payroll_status`.
- [ ] Decide whether a Timekeeper can edit optional fields after saving a scan.
- [ ] Decide whether Admins may edit attendance directly or must create corrections.
- [ ] Decide whether existing Google Form attendance history will be migrated.
- [ ] Decide whether offline scanning is required for the first release.
- [ ] Approve the screen map and role permissions.
- [ ] Approve the written product and technical design.

**Completion gate:** There are no unresolved requirements affecting database design, scan behavior, or permissions.

---

## Phase 1 — Source Data Audit and Migration Mapping

The current workbook contains:

- `Staff List`: employee ID/PIN, employee name, company email, trade/role, crew, and active status.
- `Site Codes`: date, job site, daily site code, and foreman.
- `Form Responses 1`: previous Google Form attendance responses.
- `Review`: previous validation and approval output.
- `Form Setup`: documentation for the previous Google Form workflow.

Checklist:

- [ ] Confirm whether the workbook contains real or demonstration data.
- [ ] Confirm which employee source columns should be retained when Employee ID/PIN is blank.
- [ ] Confirm the authoritative site identifier or create a permanent site code.
- [ ] Map workbook employee columns to the new employee schema.
- [ ] Generate a permanent internal UUID for every imported employee.
- [ ] Deduplicate employees by normalized Employee ID/PIN when it is present.
- [ ] Define manual duplicate resolution for employees without an Employee ID/PIN.
- [ ] Do not reject an employee solely because Employee ID/PIN is blank.
- [ ] Deduplicate sites by permanent site code.
- [ ] Decide whether legacy daily site codes are discarded or preserved as historical data.
- [ ] Decide whether company email, trade/role, and crew are required or optional.
- [ ] Create import validation rules for missing IDs, duplicate IDs, and invalid active values.
- [ ] Produce an import preview showing accepted and rejected rows.
- [ ] Run a dry import against a development Supabase project.
- [ ] Reconcile imported record counts against the workbook.
- [ ] Record the import batch, date, source filename, counts, and errors.
- [ ] Confirm that re-running the importer does not create duplicates.
- [ ] Exclude `google_form_sheet/credentials.txt` and all secrets from Git.
- [ ] Rotate any credentials that may have previously been shared or committed.

**Completion gate:** Employees and sites can be imported once, validated, reconciled, and safely re-run without duplication.

---

## Phase 2 — Project Foundation

- [ ] Create the Next.js application using TypeScript and the App Router.
- [ ] Establish feature-focused folders for authentication, employees, sites, QR codes, scanning, attendance, reports, and administration.
- [ ] Add strict TypeScript and linting configuration.
- [ ] Add environment-variable validation.
- [ ] Configure separate local, test, and production environment templates.
- [ ] Add Supabase browser and server clients with separate responsibilities.
- [ ] Add a consistent application shell and responsive navigation.
- [ ] Add shared loading, empty, error, confirmation, and permission-denied states.
- [ ] Add automated unit, integration, and browser-test commands.
- [ ] Add continuous-integration checks for linting, type checking, tests, and production builds.
- [ ] Add a `.gitignore` covering environment files, credentials, temporary inspection files, test artifacts, and build output.

**Completion gate:** A clean installation can run locally, connect to a development Supabase project, pass all checks, and build successfully.

---

## Phase 3 — Supabase Database and Security

Create version-controlled migrations for these bounded data areas:

### Core tables

- [ ] `employees`: internal UUID, optional employee ID/PIN, profile fields, active state, and QR status.
- [ ] `sites`: permanent site code, name, active state, and optional descriptive fields.
- [ ] `profiles`: authenticated user, username, display name, role, and active state.
- [ ] `employee_qr_tokens`: opaque token hash, employee, issue date, revocation date, and issuer.
- [ ] `attendance_events`: immutable Check In and Check Out scan evidence.
- [ ] `attendance_sessions`: paired attendance summary with check-in and check-out information.
- [ ] `attendance_manual_fields`: nullable overtime check, assignment check, payroll status, notes, editor, and edit time.
- [ ] `attendance_corrections`: requested and approved corrections without deleting original evidence.
- [ ] `import_batches`: source-file and import-result history.
- [ ] `audit_logs`: security-sensitive and business-sensitive actions.
- [ ] `app_settings`: controlled global configuration.

### Attendance evidence

Every scan event must store:

- [ ] Employee
- [ ] Site
- [ ] Check In or Check Out action
- [ ] Device-captured timestamp
- [ ] Server-received timestamp
- [ ] GPS latitude
- [ ] GPS longitude
- [ ] GPS accuracy in metres
- [ ] Capturing Timekeeper
- [ ] QR token reference
- [ ] Client-generated idempotency key
- [ ] Result or exception state

### Security

- [ ] Enable Row Level Security on every application table.
- [ ] Deny anonymous access to company data.
- [ ] Permit Timekeepers to read active employees and sites required for scanning.
- [ ] Permit Timekeepers to create scan events.
- [ ] Permit Timekeepers to view the records allowed by the approved scope.
- [ ] Permit Admins to manage employees, sites, attendance corrections, reports, and optional fields.
- [ ] Permit Super Admins to manage users, roles, imports, global settings, and audit access.
- [ ] Prevent client-side role escalation.
- [ ] Keep the Supabase service-role key server-side only.
- [ ] Make the internal employee UUID the required employee primary key.
- [ ] Keep Employee ID/PIN nullable.
- [ ] Add a partial unique constraint for non-empty Employee ID/PIN values without requiring the field.
- [ ] Add database constraints for unique usernames, permanent site codes, and QR tokens.
- [ ] Add indexes for attendance date, employee, site, action, and Timekeeper queries.
- [ ] Add database-generated audit entries for protected changes.
- [ ] Test every role policy with allowed and denied scenarios.

**Completion gate:** Database migrations are reproducible, role policies are tested, and unauthorized users cannot read or modify protected data.

---

## Phase 4 — Username Authentication and Role Routing

- [ ] Normalize usernames consistently and enforce case-insensitive uniqueness.
- [ ] Use Supabase Auth underneath the username-and-password interface.
- [ ] Keep internal authentication identifiers hidden from users.
- [ ] Disable public self-registration.
- [ ] Allow only a Super Admin to create application users.
- [ ] Implement sign-in, sign-out, session refresh, and expired-session handling.
- [ ] Add secure server-side user creation and password reset.
- [ ] Add temporary-password handling for newly created users.
- [ ] Require an initial password change if approved during design.
- [ ] Rate-limit repeated failed login attempts.
- [ ] Redirect users to the correct interface based on role.
- [ ] Block inactive users even when an old session exists.
- [ ] Record user creation, role changes, password resets, activation, and deactivation in the audit log.
- [ ] Test valid login, invalid login, inactive account, expired session, and role-route isolation.

**Completion gate:** Each role can authenticate using a username and password and can access only its approved interface and data.

---

## Phase 5 — Employee and Site Management

### Employees

- [ ] Build searchable and filterable employee listing.
- [ ] Add employee detail view.
- [ ] Add employee creation and editing.
- [ ] Permit employee creation without an Employee ID/PIN.
- [ ] Prevent duplicate non-empty Employee ID/PIN values.
- [ ] Permit duplicate employee names while distinguishing records by internal UUID and QR badge.
- [ ] Support employee activation and deactivation without deleting attendance history.
- [ ] Show QR issue and revocation state.
- [ ] Record all employee changes in the audit log.

### Sites

- [ ] Build searchable and filterable site listing.
- [ ] Add site detail view.
- [ ] Add site creation and editing.
- [ ] Prevent duplicate permanent site codes.
- [ ] Support site activation and deactivation without deleting attendance history.
- [ ] Record all site changes in the audit log.

**Completion gate:** Admins can maintain employee and site data after the one-time import while preserving historical records.

---

## Phase 6 — Employee QR-Code Lifecycle

- [ ] Generate opaque, non-sequential QR tokens that contain no employee personal information.
- [ ] Store only the secure token representation needed for validation.
- [ ] Link exactly one active QR token to an employee unless multiple badges are explicitly approved.
- [ ] Build single-employee QR generation.
- [ ] Build printable single-badge output.
- [ ] Build bulk badge generation and printing.
- [ ] Add QR revocation for lost or replaced badges.
- [ ] Add QR reissue with immediate invalidation of the previous token.
- [ ] Display a clear error for unknown, revoked, or inactive employee QR codes.
- [ ] Audit QR generation, printing, revocation, and reissue.
- [ ] Test valid, invalid, altered, revoked, duplicate, and inactive-employee QR codes.

**Completion gate:** Every active employee can receive a printable badge, and lost or invalid badges can be securely revoked and replaced.

---

## Phase 7 — Timekeeper Interface

- [ ] Build a touch-friendly Timekeeper home screen.
- [ ] Require an active site selection before scanning.
- [ ] Make Check In and Check Out modes visually distinct.
- [ ] Display the selected site and action prominently.
- [ ] Use the device camera to scan QR codes.
- [ ] Provide a controlled manual employee lookup fallback if approved.
- [ ] Prevent accidental repeated submission while a scan is processing.
- [ ] Show employee identity before final submission if confirmation is required.
- [ ] Show immediate success feedback with employee, site, action, and time.
- [ ] Show specific errors for invalid QR, inactive employee, missing GPS, duplicate scan, and server failure.
- [ ] Show a recent-scans list for the signed-in Timekeeper.
- [ ] Allow entry of the approved optional manual fields.
- [ ] Prevent the Timekeeper from changing protected employee, site, user, or historical audit data.
- [ ] Make the interface usable in landscape and portrait orientations.
- [ ] Test with tablet and desktop cameras.

**Completion gate:** A Timekeeper can complete repeated Check In and Check Out scans quickly without entering employee IDs manually.

---

## Phase 8 — GPS Capture and Scan Integrity

- [ ] Request browser geolocation permission at the correct point in the scan workflow.
- [ ] Capture latitude, longitude, accuracy, and capture time.
- [ ] Explain why GPS permission is required.
- [ ] Handle denied permission according to the approved product rule.
- [ ] Handle unavailable, timed-out, or low-accuracy readings explicitly.
- [ ] Never infer that GPS proves identity or automatically validates a site.
- [ ] Submit the GPS evidence and scan through one server-controlled operation.
- [ ] Generate one idempotency key per scan attempt.
- [ ] Reject duplicate submissions with the same idempotency key.
- [ ] Define the warning or blocking rule for rapid repeated Check In or Check Out scans.
- [ ] Preserve both client time and trusted server-received time.
- [ ] Test GPS success, denial, timeout, unavailable device, repeated submission, and stale-location scenarios.

**Completion gate:** Every accepted scan contains traceable GPS evidence and cannot be duplicated by an accidental retry.

---

## Phase 9 — Attendance Session Processing

- [ ] Create an immutable event for every accepted scan.
- [ ] Open an attendance session when an employee checks in.
- [ ] Close the correct open session when an employee checks out.
- [ ] Define behavior for Check Out without an open Check In.
- [ ] Define behavior for a second Check In while a session is open.
- [ ] Allow multiple sessions per employee and day if approved.
- [ ] Store Check In and Check Out GPS evidence separately.
- [ ] Record the Timekeeper responsible for each event.
- [ ] Show incomplete sessions clearly.
- [ ] Calculate elapsed attendance duration without automatically treating it as overtime.
- [ ] Keep overtime check, assignment check, and payroll status `NULL` until entered manually.
- [ ] Add controlled correction records instead of overwriting scan evidence.
- [ ] Recalculate session summaries after approved corrections.
- [ ] Test ordinary sessions, cross-midnight sessions, incomplete sessions, duplicate actions, and corrected sessions.

**Completion gate:** Attendance history remains internally consistent while original scan evidence is preserved.

---

## Phase 10 — Optional Manual Attendance Fields

- [ ] Implement the approved nullable data type for overtime check.
- [ ] Implement the approved nullable data type for assignment check.
- [ ] Implement the approved nullable values for payroll status.
- [ ] Allow authorized Timekeepers to enter these fields at the approved workflow point.
- [ ] Allow Admins to enter or revise these fields.
- [ ] Distinguish an unentered `NULL` value from an explicit negative value.
- [ ] Record editor, edit time, previous value, and new value.
- [ ] Add filters for entered, unentered, and selected values.
- [ ] Include optional fields in approved exports.
- [ ] Test blank values, valid values, invalid values, permissions, and audit history.

**Completion gate:** Optional fields remain genuinely optional and every manual change is attributable to a user.

---

## Phase 11 — Admin Interface

- [ ] Build an Admin dashboard with today's attendance summary.
- [ ] Show recent scans, incomplete sessions, and exceptions.
- [ ] Add attendance search by date, employee, site, action, and Timekeeper.
- [ ] Add employee and site management.
- [ ] Add attendance session detail with scan and GPS evidence.
- [ ] Add optional-field editing.
- [ ] Add correction request and approval workflow.
- [ ] Add filters for incomplete, corrected, and manually reviewed records.
- [ ] Add `.xlsx` export matching the approved sample attendance-log shape.
- [ ] Add CSV export for filtered attendance data.
- [ ] Prevent Admins from creating or promoting Super Admin accounts.
- [ ] Add responsive table and detail layouts for PC and tablet.

**Completion gate:** An Admin can maintain operational data, review attendance, make authorized corrections, and export reports without database access.

---

## Phase 12 — Super Admin / Developer Interface

- [ ] Build user listing and user detail pages.
- [ ] Create Timekeeper, Admin, and Super Admin users.
- [ ] Reset passwords securely.
- [ ] Activate and deactivate accounts.
- [ ] Change roles with safeguards against removing the last active Super Admin.
- [ ] View import batches and rejected rows.
- [ ] Run approved one-time employee and site imports.
- [ ] View protected audit logs.
- [ ] Manage approved application settings.
- [ ] Display system-health information without exposing secrets.
- [ ] Audit every Super Admin action.

**Completion gate:** The system can be administered without using the Supabase dashboard for ordinary operations.

---

## Phase 13 — Reports and Data Tracking

- [ ] Create a daily attendance report.
- [ ] Create employee attendance history.
- [ ] Create site attendance history.
- [ ] Create Timekeeper activity history.
- [ ] Create currently-on-site and incomplete-session views.
- [ ] Show Check In and Check Out GPS coordinates and accuracy.
- [ ] Preserve the sample workbook's Date, Employee Name, optional Employee ID/PIN, Job Site, Check In, Check Out, and Hours columns in attendance exports.
- [ ] Append the approved GPS, Timekeeper, nullable manual fields, notes, and attendance status to the `.xlsx` export.
- [ ] Show optional overtime, assignment, and payroll values without calculating them automatically.
- [ ] Allow date, employee, site, Timekeeper, and status filters.
- [ ] Export the currently filtered dataset to CSV.
- [ ] Use a documented time zone consistently for work dates and reports.
- [ ] Reconcile report totals with underlying attendance sessions.
- [ ] Test daylight-saving, cross-midnight, blank optional-field, and corrected-record reporting.

**Completion gate:** Authorized users can trace each reported attendance row back to its scans, user, site, timestamps, and GPS evidence.

---

## Phase 14 — PWA and Device Experience

- [ ] Add a web-app manifest with application name, icons, theme, and standalone display mode.
- [ ] Add install guidance for supported desktop and tablet browsers.
- [ ] Add an application icon set and launch assets.
- [ ] Confirm camera and GPS work under HTTPS and local development.
- [ ] Define service-worker caching that never exposes another user's protected data.
- [ ] Avoid caching sensitive attendance responses in shared-device storage.
- [ ] Define logout behavior for shared tablets.
- [ ] Add a visible network-status indicator.
- [ ] If offline scanning is approved, encrypt or minimize queued data and synchronize idempotently.
- [ ] If offline scanning is excluded, block submission clearly and preserve no misleading local success state.
- [ ] Test installation, update, logout, camera permission, GPS permission, and session expiry on target devices.

**Completion gate:** The app installs and behaves predictably on the approved PC and tablet browsers without leaking data between users.

---

## Phase 15 — Reliability, Privacy, and Operational Safety

- [ ] Define data-retention rules for attendance, GPS, corrections, and audit records.
- [ ] Document why GPS is collected and who may view it.
- [ ] Restrict GPS access to approved roles.
- [ ] Add structured error logging without logging passwords, tokens, or unnecessary personal data.
- [ ] Add application-level monitoring and failed-scan visibility.
- [ ] Configure Supabase backup and recovery expectations.
- [ ] Test restoration using a non-production environment.
- [ ] Add input validation at the browser, server, and database layers.
- [ ] Add protection against forged role values and direct table writes.
- [ ] Add safe handling for deleted or inactive referenced records.
- [ ] Add rate limits for login and scan endpoints.
- [ ] Add secure headers and dependency checks.
- [ ] Complete a privacy and permissions review.

**Completion gate:** The system has documented retention, recovery, audit, privacy, and incident-handling procedures.

---

## Phase 16 — Automated Test Coverage

### Unit tests

- [ ] Username normalization and validation
- [ ] Role permission decisions
- [ ] QR parsing and token validation
- [ ] Employee creation and scanning without Employee ID/PIN
- [ ] GPS payload validation
- [ ] Attendance session pairing
- [ ] Duplicate and idempotency handling
- [ ] Optional manual-field validation
- [ ] Report date and time-zone calculations

### Integration tests

- [ ] Supabase authentication lifecycle
- [ ] Row Level Security for every role
- [ ] Employee and site imports
- [ ] QR issue, revoke, and reissue
- [ ] Scan event creation
- [ ] Attendance session creation and closure
- [ ] Correction and audit behavior
- [ ] CSV export correctness
- [ ] `.xlsx` export structure, values, date formats, time formats, and nullable Employee ID/PIN behavior

### End-to-end tests

- [ ] Timekeeper signs in, selects a site, and records Check In.
- [ ] Timekeeper records Check Out.
- [ ] GPS denial follows the approved rule.
- [ ] Invalid and revoked QR codes are rejected.
- [ ] Admin reviews and corrects attendance.
- [ ] Admin enters optional fields.
- [ ] Super Admin creates and deactivates a user.
- [ ] Unauthorized roles cannot open protected interfaces.
- [ ] PWA installation and shared-device logout work as expected.

**Completion gate:** The full test suite passes consistently in a clean environment and protects every critical workflow.

---

## Phase 17 — User Acceptance and Site Pilot

- [ ] Prepare anonymized acceptance-test data.
- [ ] Print test QR badges.
- [ ] Test with at least one representative PC and one representative tablet.
- [ ] Run a complete shift: Check In, optional edits, Check Out, review, and export.
- [ ] Test poor camera conditions and damaged QR printouts.
- [ ] Test GPS indoors and under low-accuracy conditions.
- [ ] Test duplicate scans and operator mistakes.
- [ ] Test account deactivation during an existing session.
- [ ] Have Timekeepers evaluate scan speed and clarity.
- [ ] Have Admins verify search, correction, and export workflows.
- [ ] Resolve every critical and high-severity issue.
- [ ] Record formal acceptance from the product owner.

**Completion gate:** Real users complete the agreed workflow on target devices without critical defects or unresolved safety issues.

---

## Phase 18 — Production Readiness and Vercel Handoff

The project owner will perform the Vercel deployment.

- [ ] Produce a clean production build.
- [ ] Document all required public and server-only environment variables.
- [ ] Verify that no service-role key or credential is present in browser bundles.
- [ ] Provide Supabase migration and seed commands.
- [ ] Provide one-time import instructions.
- [ ] Provide Vercel build and runtime configuration instructions.
- [ ] Provide custom-domain and HTTPS guidance if applicable.
- [ ] Provide post-deployment smoke-test instructions.
- [ ] Provide rollback and database-recovery instructions.
- [ ] Confirm production Supabase URL allowlists and authentication settings.
- [ ] Project owner deploys the application to Vercel.
- [ ] Run production smoke tests for authentication, scan, GPS, attendance review, and export.

**Completion gate:** The production deployment passes smoke tests and contains no exposed secrets.

---

## Phase 19 — Documentation and Handover

- [ ] Write a Timekeeper quick-start guide.
- [ ] Write an Admin operations guide.
- [ ] Write a Super Admin account and import guide.
- [ ] Write QR printing, revocation, and replacement instructions.
- [ ] Write attendance correction instructions.
- [ ] Write backup, recovery, and incident instructions.
- [ ] Document database tables, role policies, and migration procedures.
- [ ] Document the username authentication design.
- [ ] Document how to add or deactivate employees and sites.
- [ ] Document known limitations and deliberately excluded functionality.
- [ ] Record the production version and migration state.
- [ ] Transfer operational ownership and access securely.

**Completion gate:** A new authorized operator can run the system using the documentation without developer assistance.

---

## Final Definition of Done

The project is absolutely complete only when all of the following are true:

- [ ] Every roadmap phase has passed its completion gate.
- [ ] The approved scan flow works on the target PC and tablet.
- [ ] Every accepted scan captures employee, site, action, timestamps, Timekeeper, and GPS evidence.
- [ ] No location-radius validation exists.
- [ ] Employee-to-site assignment is not automatically validated.
- [ ] Overtime check, assignment check, and payroll status are nullable and manually editable only by approved roles.
- [ ] Employees and sites have been imported once and reconciled.
- [ ] Employees without Employee ID/PIN can be imported, maintained, issued QR badges, scanned, reported, and exported.
- [ ] The `.xlsx` export preserves the sample columns and includes the approved additions.
- [ ] Employee and site changes can be maintained through the Admin interface.
- [ ] QR codes contain no personal data and can be revoked.
- [ ] Original scan evidence cannot be silently overwritten.
- [ ] Role permissions and Supabase Row Level Security pass all tests.
- [ ] Credentials and service-role secrets are absent from Git and browser code.
- [ ] Automated tests, production build, device testing, and user acceptance all pass.
- [ ] Production smoke tests pass after the project owner deploys to Vercel.
- [ ] Operations, recovery, and user documentation are delivered.
- [ ] There are no unresolved critical or high-severity defects.

## Explicitly Excluded Unless Later Approved

- Automatic geofence or permitted-location enforcement
- Automatic employee-to-site assignment validation
- Automatic overtime calculation or approval
- Automatic payroll processing
- Public self-registration
- Worker self-service scanning
- Native iOS or Android applications
- Vercel deployment performed by the implementation team
