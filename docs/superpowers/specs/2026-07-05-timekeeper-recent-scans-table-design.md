# Timekeeper Recent Scans Table Design

## Goal

Render **Recent Scans** on the Timekeeper scan page as a real table at every
viewport width, including phones. The full Attendance page keeps its existing
responsive card behavior.

## Component boundary

Create a dedicated `RecentScansTable` client component. It receives the same
role-aware attendance rows already loaded by the Timekeeper page and owns only
the compact recent-record presentation and preview selection state.

The shared `AttendanceLedger` remains unchanged for full ledgers.

## Table contract

The compact table has four columns:

1. **Employee** — employee name with work date beneath it.
2. **Time** — Check In and Check Out times in one compact cell.
3. **Status** — the existing attendance status treatment.
4. **View** — opens the existing attendance preview dialog.

The assigned site is omitted because every visible row is already restricted to
the Timekeeper's one assigned site. Employee ID/PIN, GPS, manual review fields,
and Timekeeper IDs remain omitted.

## Interaction and accessibility

- Selecting a row or its View button opens `AttendancePreviewDialog`.
- Rows remain keyboard accessible with Enter and Space.
- The View button has an employee-specific accessible label.
- Empty results show the existing no-attendance message.
- The table caption is **Recent scans**.

## Responsive behavior

The component uses a dedicated compact-table class that is excluded from the
shared mobile card conversion. It remains a four-column table at 390, 820, and
1440 pixel widths.

Cells use compact padding, controlled widths, wrapping employee names, and
short time/status labels. The table must not create document-level horizontal
overflow or require pinch zoom.

## Testing

Component tests prove:

- the four approved headers render;
- the table caption is `Recent scans`;
- a row opens the attendance preview;
- the full `AttendanceLedger` contract is unchanged.

Authenticated browser QA checks the Timekeeper scan page at 390, 820, and 1440
pixels and asserts there is no document-level horizontal overflow.
