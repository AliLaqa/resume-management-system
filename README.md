Resume Management System (v1) is a Next.js app that collects job applications via shareable public form links and provides an admin dashboard for reviewing, exporting, and managing submissions.

## Getting Started

### 1) Supabase setup
- Run `Docs/supabase/schema-v1.sql` in the Supabase SQL Editor.
- Run `Docs/supabase/seed-v1.sql` after creating the owner user in Supabase Auth.
- Apply the config checklist in `Docs/supabase/config-v1.md`.

### 2) Environment variables
Create `.env.local` from `.env.example` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (server-only)

### 3) Run the dev server
Run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key routes
- Public forms: `/forms/<slug>`
- Admin login: `/admin/login`
- Admin dashboard: `/admin`

## Build plan and docs
- Build plan: `Docs/BuildPlan-v1.md`
- Architecture: `Docs/Architecture-Design-Pattern-v1.md`
- Testing/release checklist: `Docs/Testing-and-Release-v1.md`

## Deploy
This project is designed to deploy on Vercel. Ensure Vercel env vars match the ones in `.env.local`.
