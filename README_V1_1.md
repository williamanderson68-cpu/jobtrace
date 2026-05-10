# JobTrace V1.1

This package upgrades JobTrace into a cleaner multi-page app structure.

## What this adds

- `/` — homepage search only
- `/dashboard` — Supabase-powered search results and metrics
- `/jobs/[id]` — individual job detail page
- `/admin` — basic admin/import status page
- `/api/import` — importer endpoint
- `src/lib/job-importer.ts` — V1 daily import logic
- `vercel.json` — daily cron schedule for Vercel Hobby plan

## Copy these files into your project

Copy the contents of this folder into your existing `jobtrace` project.

Your project should end up with:

```text
src/app/page.tsx
src/app/dashboard/page.tsx
src/app/jobs/[id]/page.tsx
src/app/admin/page.tsx
src/app/api/import/route.ts
src/lib/supabase.ts
src/lib/job-importer.ts
vercel.json
```

## Important

This assumes your `.env.local` already has:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

For the importer API route, this version uses the public anon key through the existing client.
That is okay for early testing if your Supabase policies allow inserts/updates.

Long term, we should switch importer writes to a server-only service role key.

## Test locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Then test:

```text
http://localhost:3000/dashboard
http://localhost:3000/admin
http://localhost:3000/api/import
```

## Deploy

```bash
git add .
git commit -m "Add JobTrace V1.1 structure"
git push
```
