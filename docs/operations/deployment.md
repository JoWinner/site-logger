# Vercel Deployment

## Before deployment

Run:

```text
pnpm install
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Configure these Vercel environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL=https://jbdzjguihkzdigicmxpx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<project publishable key>
SUPABASE_SERVICE_ROLE_KEY=<server-only service role key>
NEXT_PUBLIC_APP_URL=https://<your-vercel-domain>
APP_TIME_ZONE=Atlantic/Reykjavik
```

Never prefix the service-role key with `NEXT_PUBLIC_`.

## Supabase configuration

Add the production URL to the Supabase Auth allowed redirect URLs. Public
signup is not used. Confirm every tracked migration is applied. Enable leaked
password protection in Authentication Password Security when the project plan
supports it.

## Smoke test

1. Sign in as Super Admin.
2. Create a Timekeeper and assign one active site.
3. Confirm the Timekeeper sees only that site and cannot select another.
4. Add an employee without Employee ID/PIN and leave Current Site blank.
5. Preview and commit employee and site imports.
6. Issue and print individual and bulk QR badges.
7. Check an employee in and out with GPS and QR.
8. Confirm the Timekeeper attendance page shows only records they captured.
9. Confirm Admin employee and attendance ledgers are grouped by site.
10. Export a multi-site Admin date range to CSV and XLSX.
11. Export a Timekeeper date range and confirm only the assigned site appears.
12. Verify the app at desktop, tablet, and phone widths.
13. Install the PWA from a supported desktop or tablet browser.

## Rollback

Promote the previous successful Vercel deployment for application rollback.
Database migrations are forward-only; take a Supabase backup before destructive
migrations and apply corrective migrations instead of editing history.
