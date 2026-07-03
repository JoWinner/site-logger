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
```

Never prefix the service-role key with `NEXT_PUBLIC_`.

## Supabase configuration

Add the Vercel production URL to the Supabase Auth allowed redirect URLs. Public signup is not used. Confirm the `initial_attendance_schema` migration is present before deploying.

## Smoke test

1. Sign in as Super Admin.
2. Create a Timekeeper and Admin.
3. Confirm the Timekeeper cannot open Admin pages.
4. Add an employee without Employee ID/PIN.
5. Issue and print the employee QR badge.
6. Add or select an active site.
7. Check the employee in with GPS and QR.
8. Check the employee out.
9. Enter optional manual fields.
10. Export `.xlsx` and verify columns A–P.
11. Install the PWA from a supported desktop or tablet browser.

## Rollback

Application rollback is performed by promoting the previous successful Vercel deployment. Database migrations are forward-only; take a Supabase backup before future destructive migrations and apply corrective migrations instead of editing migration history.
