# Responsive Ledgers and Attendance Preview Design

## Purpose

Make employee, site, and attendance records comfortable to use on phones,
tablets, and desktop screens without pinching or page-level horizontal
scrolling. Preserve a dense desktop ledger while presenting the same
information as readable labelled records on narrow screens.

## Employees and Sites

The employee page will use a full semantic table on desktop. Each row contains:

- Active state
- Employee name
- Optional Employee ID/PIN
- Trade role
- Crew
- Last updated time
- Edit action
- Issue/print QR action

The add form remains available above the ledger instead of permanently consuming
a narrow left column. Editing opens a focused modal or drawer so rows remain
compact. On screens below 720 px, every table row becomes a labelled record card
with 48 px action targets. No employee field is hidden; secondary fields wrap
instead of overflowing.

The site ledger follows the same responsive pattern with site name, permanent
site code, active state, last update time, and edit action.

## Attendance Ledger

A shared `AttendanceLedger` component will serve the Admin, Super Admin, and
Timekeeper interfaces. Desktop uses a compact table with a sticky header.
Mobile uses stacked records and never requires horizontal scrolling.

The primary row content is:

- Work date
- Employee
- Site
- Check-in and check-out times
- Worked hours
- Status
- Captured GPS place name

Timekeeper display uses `Display Name · short-user-id`, with the readable name
first. Coordinates and accuracy remain visible as secondary evidence.

The Admin/Super Admin ledger uses server pagination with 25 records per page.
The Timekeeper recent-scans section remains limited to the latest 12 records.
Both layouts preserve keyboard navigation and visible focus states.

## Quick Preview Modal

Selecting an attendance row opens a native accessible dialog. It contains:

- Employee, site, date, status, and worked hours
- Check-in and check-out timestamps
- GPS place names, coordinates, and accuracy
- Timekeeper display names and short IDs
- Optional overtime, assignment, payroll, and notes controls
- Corrected-time controls for Admin and Super Admin users
- A clear `Open full attendance page` action

The dialog is a centred panel on desktop and a full-height sheet on phones. Its
header and footer actions remain visible while the content scrolls. Escape,
backdrop click, close button, focus return, and screen-reader labelling are
supported. Mutations refresh the row without forcing the user to leave the
ledger.

## Error and Empty States

Empty tables explain what record is missing and show the relevant add/import
action. Failed modal requests leave the ledger intact and show a retryable error
inside the dialog. Long names, site labels, location names, and notes wrap
without changing page width.

## Verification

- Component tests cover responsive row content, modal opening/closing, role-based
  actions, timekeeper display names, and the full-page link.
- Playwright checks widths of 360, 390, 768, 1024, and 1440 px.
- Every tested page must satisfy `document.documentElement.scrollWidth <=
  document.documentElement.clientWidth`.
- Touch actions are at least 48 px and all controls remain reachable at 200%
  browser zoom.
