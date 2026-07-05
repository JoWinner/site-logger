# Admin Guide

## Employees

Use **Employees** to add or edit workers. Employee ID/PIN and Current Site are
optional. Current Site organizes the employee ledger but never prevents a
worker from being scanned at another site. Deactivate former employees instead
of deleting them.

Employee CSV/XLSX imports require `Full Name`; `Employee ID/PIN`, `Trade Role`,
`Site Code` or `Site Name`, and `Active` are optional. Unknown or ambiguous
sites are rejected during preview.

Super Admins can issue and print up to 100 QR badges together. Reissuing a
badge revokes the previous active token.

## Sites and Timekeepers

Site codes are permanent references. A Super Admin assigns every Timekeeper to
exactly one active site from **System users**. The Timekeeper cannot choose a
different site while scanning or exporting.

## Attendance

The Attendance page groups records into a separate ledger for every site.
Search, sort, and filter by site, status, overtime, and date. Select a row for
the quick preview, raw GPS evidence, manual review, corrections, and the full
attendance page.

Admin exports require a From/To range and one or more selected sites:

- CSV contains one dataset sorted by site and date.
- XLSX contains one worksheet for each site.

Both formats contain Date, Employee Name, Job Site, Check In, Check Out, Hours,
Check In By, Check Out By, Overtime Check, and Attendance Status.

## Manual fields

Overtime check, assignment check, payroll status, and notes remain optional
manual fields. Only Overtime Check appears in the attendance ledger and
exports. The system never calculates or approves these fields automatically.
