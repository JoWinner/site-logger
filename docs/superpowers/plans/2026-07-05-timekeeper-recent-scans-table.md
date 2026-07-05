# Timekeeper Recent Scans Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Timekeeper Recent Scans mobile-card presentation with a dedicated compact table that remains tabular at every supported viewport.

**Architecture:** Add a focused client component for the four-column recent-record view and reuse the existing attendance preview dialog. The Timekeeper page switches only its Recent Scans section to this component; the shared full-ledger component and its mobile card behavior remain unchanged.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS, Vitest, Testing Library.

## Global Constraints

- Recent Scans remains a table at 390, 820, and 1440 pixel widths.
- Columns are Employee with date, Time, Status, and View.
- Row and View interactions open the existing attendance preview.
- The component must not create document-level horizontal overflow.
- The full Attendance ledger remains unchanged.

---

### Task 1: Add the compact Recent Scans table

**Files:**
- Create: `components/attendance/recent-scans-table.tsx`
- Modify: `app/(protected)/timekeeper/page.tsx`
- Modify: `app/globals.css`
- Create: `tests/unit/components/recent-scans-table.test.tsx`

**Interfaces:**
- Consumes: `AttendanceLedgerRow[]` and `AppRole`
- Produces: `RecentScansTable({ rows, role })`

- [ ] **Step 1: Write the failing component test**

Render one attendance row and assert the table caption, four headers, employee
date, combined time cell, and preview interaction:

```tsx
render(<RecentScansTable role="timekeeper" rows={[row]} />);

expect(screen.getByRole("table", { name: "Recent scans" })).toBeInTheDocument();
expect(
  screen.getAllByRole("columnheader").map((header) => header.textContent),
).toEqual(["Employee", "Time", "Status", "View"]);

fireEvent.click(
  screen.getByRole("button", { name: "Open recent scan for Marcus Hill" }),
);
expect(
  screen.getByRole("dialog", { name: "Marcus Hill attendance" }),
).toBeInTheDocument();
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
pnpm.cmd exec vitest run tests/unit/components/recent-scans-table.test.tsx
```

Expected: FAIL because `RecentScansTable` does not exist.

- [ ] **Step 3: Implement the component**

Create a client component that renders:

```tsx
<table className="recent-scans-table">
  <caption>Recent scans</caption>
  <thead>
    <tr>
      <th>Employee</th>
      <th>Time</th>
      <th>Status</th>
      <th>View</th>
    </tr>
  </thead>
</table>
```

Employee includes `employee_name_snapshot` and `work_date`. Time uses short
Check In and Check Out values. Rows support click, Enter, and Space. The View
button stops propagation and selects the same row for
`AttendancePreviewDialog`.

- [ ] **Step 4: Switch the Timekeeper page**

Replace the Recent Scans `AttendanceLedger` import and rendering with:

```tsx
<RecentScansTable role={profile.role} rows={sessions} />
```

- [ ] **Step 5: Add compact always-table CSS**

Add dedicated styles for fixed column proportions, compact cell padding,
wrapped employee names, and an abbreviated mobile View button. Do not attach
the shared `.responsive-table` class, so the existing card conversion cannot
affect this table.

- [ ] **Step 6: Verify GREEN**

Run:

```powershell
pnpm.cmd exec vitest run tests/unit/components/recent-scans-table.test.tsx tests/unit/components/attendance-ledger.test.tsx
pnpm.cmd typecheck
pnpm.cmd lint
```

Expected: all commands exit 0.

- [ ] **Step 7: Run responsive authenticated QA**

Open `/timekeeper` at 390, 820, and 1440 pixels. Assert:

```js
document.querySelector(".recent-scans-table") !== null
document.documentElement.scrollWidth <= window.innerWidth
```

- [ ] **Step 8: Commit and push**

```powershell
git add app components tests docs
git commit -m "feat: keep recent scans in compact table"
git push origin codex/operations-upgrade
```
