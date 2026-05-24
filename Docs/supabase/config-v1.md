# Supabase config checklist (v1)

## Auth (required)
- Enable **Email** provider (email + password sign-in).
- Set **Site URL** to your deployed Vercel domain (and optionally `http://localhost:3000` for local dev).
- Add **Redirect URLs** for password reset:
  - `http://localhost:3000/admin/reset-password`
  - `https://<your-vercel-domain>/admin/reset-password`

## Storage (required)
- Ensure buckets exist (created by `Docs/supabase/schema-v1.sql` or via the Dashboard):
  - `rms-cv` (public)
  - `rms-logos` (public)

