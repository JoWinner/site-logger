# Admin Guide

## Employees

Use **Employees** to add or edit workers. Employee ID/PIN is optional. Deactivate former employees instead of deleting them so historical attendance stays readable.

Open **Issue / print QR badge** for an active employee. Reissuing a badge immediately revokes the previous QR token. The QR code contains no name or Employee ID/PIN.

Use **Import CSV/XLSX** for batch changes. Preview the file before importing.
Employee files require `Full Name`; `Employee ID/PIN`, `Trade Role`, `Crew`,
and `Active` are optional. Existing records match by Employee ID/PIN. A
same-name row without an ID remains a separate employee and is highlighted as
a warning.

Super Admins can open **Bulk QR badges**, filter and select up to 100 active
employees, issue their badges atomically, and print the resulting badge grid.
Issuing revokes each selected employee's old badge. Print before leaving the
page because raw QR tokens are not stored in the browser after navigation.

## Sites

Use **Sites** to maintain permanent site codes and names. Daily site codes and employee-to-site assignments are not used.

Use **Import CSV/XLSX** to create or update sites. Site files require `Site
Code` and `Site Name`; `Active` is optional. Existing sites match by Site Code.

## Attendance

Use **Attendance ledger** to review Check In/Check Out times, GPS coordinates and accuracy, Timekeepers, hours, manual fields, and status.

Select any attendance row to open the quick preview. It contains the readable
GPS location, captured coordinates, static map, Timekeeper name and ID, manual
review controls, correction controls for authorized roles, and a link to the
full attendance page.

Corrections adjust the displayed session summary and require a reason. Original scan events remain immutable.

Select **Export .xlsx** to download the A–P workbook. Missing Employee ID/PIN and unset manual fields remain blank.

## Manual fields

- Overtime check: manual Yes, No, or blank
- Assignment check: manual Yes, No, or blank
- Payroll status: manual Pending, Approved, On hold, Paid, or blank

The system does not calculate or approve overtime, assignment, or payroll status automatically.
