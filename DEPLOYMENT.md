# Deploying to Production (Vercel)

## Before you deploy — one thing to fix in your current dev database
Your Neon dev database already has the `role`/`employeeId` columns (from
earlier manual `prisma migrate dev` runs), but its migration history table
doesn't know about the migration file that's now properly saved in this
repo (`prisma/migrations/20250709000000_add_user_role_employee_link`).
Reconcile it once, locally:
```bash
npx prisma migrate resolve --applied 20250709000000_add_user_role_employee_link
```
This just tells Prisma "this migration is already applied, don't re-run
it" — it doesn't touch your data. Skip this if you're deploying to a brand
new/empty database; `prisma migrate deploy` will apply it correctly there
on its own.

## 1. Push to GitHub
```bash
git init
git add .
git commit -m "HR management system"
```
Create a repo on GitHub, then:
```bash
git remote add origin https://github.com/<you>/hr-management-system.git
git push -u origin main
```
Double check `.env` is NOT in what you're committing — it's already in
`.gitignore`, but verify with `git status` before pushing.

## 2. Production database
Use a separate database from your dev one (Neon lets you create multiple
projects/branches for free). Create a new Neon project for production,
copy its connection string.

## 3. Import into Vercel
- Go to vercel.com → New Project → import your GitHub repo
- Framework preset: Next.js (auto-detected)
- Add environment variables (Settings → Environment Variables):
  ```
  DATABASE_URL=your production Neon connection string
  JWT_SECRET=a long random string (different from dev, ideally)
  JWT_REFRESH_SECRET=another long random string
  ```
- Deploy

## 4. Apply migrations to the production database
Vercel's build step runs `npm install` (which now runs `prisma generate`
automatically via the `postinstall` script) then `next build` — but it
does **not** run migrations for you. Do that once yourself, from your
machine, pointed at the production database:
```bash
# temporarily point at production DB
$env:DATABASE_URL="your production connection string"
npx prisma migrate deploy
npx prisma db seed   # optional — creates the demo admin/employee logins
```
(Or add a one-off `DATABASE_URL` override to the command instead of
exporting it, if you don't want to touch your local `.env`.)

## 5. Verify
Visit your Vercel URL, log in with `admin@hrms.com` / `password123` (or
whatever you seeded), confirm Employees/Leave/Reports all load real data.

## What I fixed to make this deployment-safe
- **Richer seed data** — `prisma/seed.ts` now creates 8 employees across 6
  departments (IT, HR, Finance, Marketing, Operations, Sales) with one
  marked Inactive, and 6 leave requests spread across Pending/Approved/
  Rejected (including one that's active right now, so "Currently On Leave"
  in Reports isn't empty on first load). Much better first impression for
  an interviewer clicking around than a single employee and one leave
  request.
- **Missing migration file** — the `role`/`employeeId`/leave-default schema
  changes only ever existed in `schema.prisma` and in your local dev
  database's actual columns, never as a saved migration file in the repo.
  A fresh production database would have been missing those columns
  entirely. Added the migration file by hand.
- **Missing `postinstall` script** — `next build` alone doesn't generate
  the Prisma Client; Vercel would hit the same "Prisma Client did not
  initialize" error you saw locally. Added `"postinstall": "prisma generate"`
  so it happens automatically after every install.
- **Fake demo-mode masking real errors** — the login page had a hardcoded
  fallback that hid actual error messages behind a fake "Backend not
  connected, use these demo credentials" banner referencing accounts that
  don't exist. Fixed to show real errors.
- **Dashboard silently using fake data** — `lib/services/dashboard.ts` was
  calling Prisma directly from browser code (impossible — Prisma is
  server-only), always failed, and silently fell back to hardcoded numbers.
  Fixed to call the real API route.
