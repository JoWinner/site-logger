# QR Attendance Tracker — Completion Roadmap

## Delivered

- [x] Installable Next.js PWA for PC and tablet
- [x] Supabase PostgreSQL, Auth, RLS, migrations, and audit trails
- [x] Username/password authentication with Timekeeper, Admin, and Super Admin roles
- [x] Password visibility controls and active sidebar navigation
- [x] Optional Employee ID/PIN
- [x] CSV/XLSX employee and site imports with preview and validation
- [x] Flexible nullable employee Current Site; no employee scan restriction
- [x] One enforced active site assignment per Timekeeper
- [x] Frank assigned to Atlas
- [x] GPS-required QR Check In and Check Out without geofencing
- [x] Timekeeper scans recorded only against the authenticated assigned site
- [x] Timekeeper Recent Scans limited to records they captured
- [x] Dedicated Timekeeper Attendance page and assigned-site exports
- [x] Search, sort, and filters across operational ledgers
- [x] Employee and attendance ledgers grouped into separate site sections
- [x] Mobile card-style responsive tables without page-level overflow
- [x] Attendance quick preview, raw GPS evidence, manual review, and corrections
- [x] Site overview grouping active employees, Timekeepers, and today's sessions
- [x] Individual and bulk-issued/printed QR badges
- [x] Admin multi-site date-range CSV and XLSX attendance exports
- [x] CSV sorted by site/date and XLSX separated into one worksheet per site
- [x] Map and reverse-geocoding integration removed
- [x] Crew removed from employee data, forms, imports, and ledgers

## Attendance ledger and export contract

The visible ledger and CSV/XLSX exports contain:

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

Employee ID/PIN, GPS, Assignment Check, Payroll Status, and Notes are omitted
from ledgers and exports. Raw GPS coordinates and accuracy remain available in
attendance evidence. Assignment Check, Payroll Status, and Notes remain
optional manual fields in the attendance preview/detail workflow.

## Remaining owner handoff

- [ ] Add Supabase production secrets to Vercel.
- [ ] Enable leaked-password protection when supported by the Supabase plan.
- [ ] Create the first Super Admin with the documented bootstrap command.
- [ ] Deploy the verified branch to Vercel.
- [ ] Run the deployment smoke test in `docs/operations/deployment.md`.
