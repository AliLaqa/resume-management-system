# Testing-and-Release-v1

## Manual test checklist (v1)
### Public form
- Open an active form: `/forms/<slug>` renders title/summary/logo/theme.
- Submit with valid fields + PDF/DOC/DOCX → success message shown.
- Submit without CV → shows validation error.
- Submit with inactive/non-existent form → shows not-found / unavailable.

### Admin auth
- Login with email/password at `/admin/login`.
- Forgot password at `/admin/forgot-password` sends reset email.
- Reset link opens `/admin/reset-password` and password can be updated.
- Non-admin user is redirected to `/admin/unauthorized`.

### Forms
- Create a form in `/admin/forms` (slug normalizes and stays unique).
- Edit form metadata in `/admin/forms/<slug>/edit` and verify public page reflects it.
- Toggle active/inactive and verify public access updates accordingly.

### Submissions
- View per-form submissions at `/admin/forms/<slug>`.
- Open a submission details page and confirm fields match.
- Download CV via dashboard link (uses `/admin/cv?applicationId=...` redirect).

### Export
- Select specific submissions and export CSV.
- Select specific submissions and export XLSX.
- Confirm export columns include CV public URL.

### Admin management (owner)
- Owner can invite an admin by email (max 5).
- Owner can remove a non-owner admin.
- Owner cannot remove the owner; non-owner cannot remove anyone.

### Deletion (owner)
- Owner deletes selected submissions; corresponding CV objects are removed from Storage.

### Logs
- Confirm logs exist for: form create/update/publish, export, admin add/remove, application viewed, CV downloaded, application deleted.

## RLS verification notes (v1)
- `forms`: anon can only read active forms; admins can read/write.
- `applications`: anon can insert only for active forms; admins can read; only owner can delete.
- `admins`: only owner can insert/delete; owner is protected by DB trigger.
- `admin_event_log`: admins can read; inserts should be server-side with service role (bypassing RLS).
- If admin authorization behaves unexpectedly, run `Docs/supabase/patch-rls-v1.sql` in the Supabase SQL Editor.

## Vercel deployment smoke test (v1)
- Set env vars in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SECRET_KEY` (server-only)
- Configure Supabase Auth Site URL + Redirect URLs (see `Docs/supabase/config-v1.md`).
- Deploy and verify:
  - public form render
  - admin login + password reset
  - exports download successfully
