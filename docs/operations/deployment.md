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

Configure these Vercel environment variables for Production and Preview as appropriate:

```text
NEXT_PUBLIC_SUPABASE_URL=https://jbdzjguihkzdigicmxpx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<project publishable key>
SUPABASE_SERVICE_ROLE_KEY=<server-only service role key>
NEXT_PUBLIC_APP_URL=https://<your-vercel-domain>
APP_TIME_ZONE=Atlantic/Reykjavik
MAPBOX_ACCESS_TOKEN=<server-only Mapbox token>
MAPBOX_GEOCODING_MODE=permanent
```

Never prefix the service-role or Mapbox key with `NEXT_PUBLIC_`. Use
`MAPBOX_GEOCODING_MODE=temporary` in a test environment that is not licensed to
retain geocoding results.

## Supabase configuration

Add the Vercel production URL to the Supabase Auth allowed redirect URLs.
Public signup is not used. Confirm all six tracked migrations are present
before deploying. In **Authentication → Password Security**, enable leaked
password protection for production when the project plan supports it.

## Smoke test

1. Sign in as Super Admin.
2. Create a Timekeeper and Admin.
3. Confirm the Timekeeper cannot open Admin pages.
4. Add an employee without Employee ID/PIN.
5. Preview and commit one employee and one site import.
6. Issue and print an individual QR badge.
7. Bulk-issue and print badges as Super Admin.
8. Add or select an active site.
9. Check the employee in with GPS and QR.
10. Confirm the resolved location name and static map in the attendance preview.
11. Check the employee out.
12. Enter optional manual fields and submit a correction with a reason.
13. Export `.xlsx` and verify columns A–P.
14. Verify the ledgers at desktop, tablet, and phone widths.
15. Install the PWA from a supported desktop or tablet browser.

## Rollback

Application rollback is performed by promoting the previous successful Vercel deployment. Database migrations are forward-only; take a Supabase backup before future destructive migrations and apply corrective migrations instead of editing migration history.
