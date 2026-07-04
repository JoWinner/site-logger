# Employee and Site Import Design

## Purpose

Allow Admin and Super Admin users to add or update master data from `.csv` and
`.xlsx` files while preserving the existing single-record forms.

## Accepted Employee Columns

Header matching is case-insensitive and ignores spaces, underscores, hyphens,
and punctuation. The importer accepts common aliases for:

- `Full Name` — required
- `Employee ID / PIN` — optional
- `Trade Role` — optional
- `Crew` — optional
- `Active` — optional; defaults to `true`

The import does not require Employee ID/PIN. An imported row with an ID/PIN that
matches an existing employee updates that employee. A row without an ID/PIN is
created as a new employee. Matching names without an ID/PIN produce a warning
but never silently update a person.

## Accepted Site Columns

- `Site Code` — required
- `Site Name` or `Name` — required
- `Active` — optional; defaults to `true`

A matching Site Code updates the existing site. Site codes remain permanent,
case-insensitive identifiers.

## Preview and Commit Flow

The add section includes `Add one` and `Import file` tabs. Import accepts files
up to 5 MB and 2,000 data rows.

1. The browser uploads the file to the protected preview endpoint.
2. The server parses the first worksheet for `.xlsx` or the CSV dataset.
3. Headers are normalized and every row is validated.
4. The preview classifies each row as `new`, `update`, `warning`, or `error`.
5. The user reviews counts and row-level messages.
6. Commit remains disabled while any error is present.
7. The server revalidates the normalized rows and performs one atomic import.

Blank spreadsheet rows are ignored. Unknown columns are preserved only in the
preview metadata and are not written to the database. Formula cells use their
calculated values. Passwords, QR tokens, attendance data, and system UUIDs are
never accepted through these imports.

## Atomicity and Audit

Postgres import functions accept validated JSON arrays. They run as the signed-in
user, verify Admin or Super Admin authorization, and complete all rows in one
transaction. A failure rolls back the whole import. Existing employee/site audit
triggers continue to record inserts and updates.

The result reports created, updated, warned, and rejected counts. The browser
refreshes the ledger only after a successful commit.

## Security and Error Handling

- File contents are parsed server-side.
- MIME type, extension, size, row count, and field lengths are validated.
- Spreadsheet formulas are treated as values and are never evaluated by the
  server.
- CSV cells beginning with formula characters are handled as plain input.
- Database errors are mapped to row-safe messages without exposing SQL details.

## Verification

- Unit tests cover header aliases, optional IDs, boolean parsing, duplicate-name
  warnings, row limits, and malformed files.
- Route tests cover authorization, preview, blocked commits, and successful
  normalized commits.
- Supabase tests cover atomic rollback and the approved update rules.
- Browser tests upload both CSV and XLSX fixtures and verify the mobile preview.
