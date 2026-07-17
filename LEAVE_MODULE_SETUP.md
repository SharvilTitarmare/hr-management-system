# What Changed & How to Run It

## Pass 5: Live-updating data (no refresh needed)
Added `swr` and converted Dashboard, Employee Directory, and Leave Requests
to use it instead of manual `useEffect` + `fetch`:

- **Polling** — each of those views re-fetches automatically every 5 seconds
  in the background, so if someone else approves a leave request or adds an
  employee, you'll see it appear without refreshing the page.
- **Revalidate on focus** — switching back to the tab also triggers an
  immediate refresh.
- **Instant refresh on your own actions** — approving/rejecting leave,
  adding/deleting an employee, or applying for leave calls `mutate()` right
  away instead of waiting for the next poll, so your own changes feel
  instant.
- A small pulsing "Live" indicator shows on each of these sections.

**Why polling instead of WebSockets:** if you deploy this on Vercel's free
tier, serverless functions get killed after ~10 seconds — a persistent
WebSocket connection wouldn't survive there. Polling with SWR (the
"stale-while-revalidate" pattern) is what a lot of real production apps
actually use at this scale, works fine on serverless, and needs zero extra
infrastructure. If you ever need true push-based updates (e.g. a chat app),
that's when you'd reach for something like Pusher/Ably or a dedicated
WebSocket server — worth knowing the tradeoff if an interviewer asks "why
not WebSockets?"

New files: `lib/swr-fetcher.ts` (shared authenticated fetcher),
`components/providers/swr-provider.tsx` (global polling config),
`components/ui/live-badge.tsx` (the pulsing indicator).

## Pass 4: Fixed the Dashboard Overview (was silently broken)
- `lib/services/dashboard.ts` was calling `prisma.employee.count()` **directly
  from browser code** — Prisma can't run client-side, so this always threw,
  silently caught the error, and fell back to hardcoded numbers (245
  employees, "Sarah Wilson joined Marketing", etc.). That's the bug you saw
  on the dashboard after logging in.
- Rewrote it to properly `fetch("/api/dashboard/stats")` with the auth
  token, like every other service in this project. Added auth to that route
  too, for consistency.
- Removed the fake fallback entirely — if the request fails now, you see a
  real error message, not made-up data.
- Updated the demo banner to say what's actually true (Dashboard, Employees,
  Leave, Reports = real; Recruitment/Training/Performance/Disciplinary =
  still sample data) and fixed hardcoded light-mode-only colors that didn't
  render right against the dark theme.

## Pass 3: Reports (raw SQL, not Prisma's query builder)
- New `app/api/reports/route.ts` — admin-only endpoint with three
  hand-written SQL queries run via `prisma.$queryRaw`, instead of Prisma's
  query builder: leave requests grouped by department (JOIN + GROUP BY +
  `FILTER`), headcount/tenure/salary per department (`AGE()`, `EXTRACT()`),
  and who's currently on approved leave (JOIN + date-range `WHERE`).
- New `components/reports/reports-dashboard.tsx` — renders the results, with
  a "View SQL" toggle that shows the exact queries being run (good for
  walking an interviewer through it).
- Added "Reports" to the sidebar, admin-only (employees don't see it, since
  the API would 403 them anyway).

**Why raw SQL here specifically:** Prisma's query builder is great for
straightforward CRUD, but once you need cross-table aggregation, `GROUP BY`,
conditional counts, or date math, hand-written SQL is clearer than chaining
ORM calls and reducing in JavaScript. This is also the honest reason real
teams reach for raw SQL — a good thing to say if asked "why not just use
Prisma for everything?"

**Note:** these queries use Postgres-specific syntax (`FILTER`, `AGE()`,
`EXTRACT()`) — if you ever switch to MySQL, they'd need rewriting since
MySQL doesn't support `FILTER`.

## Pass 2: Employee Management + Design System
- `employee-table.tsx`, `add-employee-dialog.tsx`, `employee-management.tsx` now
  call the real `/api/employees` endpoints instead of `sample-data.ts`.
- `lib/services/employees.ts` — full client CRUD (fetch/create/delete).
- `app/api/employees/route.ts` and `[id]/route.ts` — now require auth, and
  only Admins can create/edit/delete.
- Removed the Emergency Contact / Address tabs from the add-employee form —
  those fields aren't in the `Employee` schema, so keeping them would have
  silently thrown away data the user typed in. Better to be honest about
  what's actually stored.
- New design system in `app/globals.css`: a deep indigo base with lime +
  magenta accents (replacing the default shadcn gray/blue), Space Grotesk as
  the display font (`app/layout.tsx`), and a signature "ID badge" card layout
  for the employee directory (`lib/department-colors.ts` assigns each
  department a consistent accent color).
- Fixed a couple of pre-existing bugs surfaced while doing this:
  `types/user.ts` had roles (`admin`, `hr_manager`...) the API never
  actually returned, and a few components referenced `user.firstName` /
  `user.lastName` which don't exist on the real user object.

## Pass 1: Leave Module
(unchanged from before — see below)

## What I changed
Previously the Leave module (and Employees table) had UI but was reading
hardcoded arrays from `lib/sample-data.ts` — nothing touched the database.

Now:
- `prisma/schema.prisma` — added `role` (`Admin` / `Employee`) and an optional
  `employeeId` link on `User`, so a login can be tied to a real `Employee`
  row and we know who's allowed to approve leave.
- `app/api/leave/route.ts` — `GET` (list, auto-filtered to "your own" for
  employees, everyone for admins) and `POST` (apply for leave).
- `app/api/leave/[id]/route.ts` — `PATCH` (admin approve/reject) and
  `DELETE` (cancel a pending request).
- `lib/server/auth.ts` — shared helper to read the JWT and load the
  logged-in user's role/employeeId.
- `lib/services/leave.ts`, `lib/services/employees.ts` — client-side fetch
  wrappers that attach the auth token.
- `components/leave/*` — rewired to call the real API instead of
  `sample-data.ts`; stat cards are now computed from real leave requests;
  admins get an employee picker + approve/reject actions, employees just see
  and file their own requests.
- `prisma/seed.ts` — creates a demo Admin and a demo Employee login so you
  can test both roles immediately.

## 1. Get a Postgres database
Easiest free option for a student project: [neon.tech](https://neon.tech) or
[supabase.com](https://supabase.com) — both give you a free Postgres
connection string in under a minute. (Local Postgres via Docker works too if
you already have it.)

## 2. Environment variables
Copy `.env.example` to `.env` and fill in:
```
DATABASE_URL=<your postgres connection string>
JWT_SECRET=some-long-random-string
JWT_REFRESH_SECRET=another-long-random-string
```

## 3. Install, migrate, seed
```bash
npm install
npx prisma migrate dev --name add_user_role_employee_link
npx prisma db seed
npm run dev
```
The migration will pick up every schema change already made in this repo
(the earlier init/auth/training migrations, plus the new role/employeeId
fields), so you only need to run this once.

## 4. Test both roles
Go to `/login`:
- **Admin:** `admin@hrms.com` / `password123` — sees everyone's leave
  requests, can pick any employee when filing, can approve/reject.
- **Employee:** `jane.smith@hrms.com` / `password123` — sees and files only
  their own requests, no approve/reject controls.

Try: log in as Jane → file a leave request → log out → log in as Admin →
see it appear in the table → Approve it → log back in as Jane → see the
status update.

## What to say in an interview
"I took an open-source HR system that had a nice UI but wasn't actually
wired to the database, and built out the leave-management feature
end-to-end — Prisma schema changes for role-based access, REST API routes
with JWT auth, and connected the existing React components to real data
instead of mock arrays. I also added role-based authorization so employees
can only see their own requests while admins can approve or reject anyone's."

That's a concrete, specific story — much stronger than "I built an HR
system" with no detail to back it up.

## Honest gaps to know about (don't get caught off guard)
- Employee and Recruitment/Training/Performance/Disciplinary modules are
  still on mock data — only Auth, Employees, Dashboard stats, and now Leave
  are real. Say so if asked; it's normal for a scoped project.
- There's no seed data linking every employee to a login — only Jane Smith
  is wired up as a demo. Fine for a resume project, worth mentioning if
  asked how you'd extend it (self-serve registration linking a new User to
  an Employee row).
- The `/api/employees` route isn't auth-protected yet (only `/api/leave` is)
  — good follow-up "if I had more time" answer.
