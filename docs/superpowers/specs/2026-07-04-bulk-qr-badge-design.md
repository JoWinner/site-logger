# Bulk QR Badge Issuing and Printing Design

## Purpose

Give Super Admin users a practical way to issue and print badges for many
employees without opening one employee page at a time.

## Badge Desk

The Super Admin navigation gains `Bulk badges`. The page contains the active
employee ledger with:

- Search by employee name, optional ID/PIN, trade role, or crew
- Row selection
- Select all currently filtered employees
- Clear selection
- Selected-record count
- `Issue selected badges` action

Only Super Admin users can use the bulk endpoint. Existing single-employee badge
issuing remains available to Admin and Super Admin users.

## Issuing

Bulk issuing accepts at most 100 unique employee IDs per request. Before
execution, the UI warns that issuing a new badge revokes each employee's
previous active badge. The user must explicitly confirm.

One Postgres function performs the selected revocations and token inserts in a
transaction. Raw QR tokens are returned once to the requesting browser and are
never written to logs, local storage, or analytics. If any selected employee is
missing or inactive, the entire operation rolls back.

## Print Layout

After successful issuing, the browser generates QR images locally and switches
to a print-ready badge grid:

- Employee name
- Optional Employee ID/PIN
- Company/app identifier
- High-error-correction QR image
- One consistent physical badge size
- Page breaks that never split a badge

The individual badge page temporarily sets the print document title to
`<Employee Name> - QR Badge`, producing an employee-named default PDF filename
in browsers that honour the title. The bulk document title is
`Employee QR Badges - <date>`, and every printed badge is visibly named after
its employee.

The normal app navigation, filters, and controls are hidden in print mode.

## Mobile Behaviour

Selection rows become labelled cards under 720 px. The selected-count/action
bar remains reachable without covering content. Badge previews use one column
on phones and do not overflow the viewport. Printing itself is optimized for
desktop/tablet browsers, but badges can still be issued and previewed on phones.

## Error Handling

Issuing failures preserve the employee selection and show a retryable message.
Closing or refreshing after issuing discards raw tokens, so the UI clearly tells
the user to print before leaving. Reissuing is the only recovery when tokens are
discarded.

## Verification

- Unit tests cover selection, filtering, confirmation, filename sanitization,
  and QR generation.
- API and database tests cover Super Admin authorization, 100-record limits,
  atomic rollback, revocation, and one-time raw-token responses.
- Print CSS is checked at A4 and Letter sizes.
- Browser tests verify phone selection, desktop multi-badge preview, and absence
  of raw tokens in persistent browser storage.
