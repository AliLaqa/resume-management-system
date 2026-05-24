# Architecture-Design-Pattern-v1

## Why this architecture
This project uses the Next.js App Router (production v1) with a simple layered structure:
- **UI (routes + components)**: pages, layouts, and client components for interactivity.
- **Server boundary (route handlers + server actions)**: the only place that mutates data, enforces auth, and talks to Supabase with privileged credentials.
- **Data access layer (`src/lib/*`)**: small, reusable helpers for Supabase clients, authorization checks, validation, and shared constants.

This keeps business rules centralized, prevents spaghetti code, and supports the DRY principle (shared logic lives in one place).

## Core design decisions (v1)
- **Public applicants**: no applicant accounts; public form by slug.
- **Admins**: Supabase Auth (email + password) for authentication, plus `admins` allowlist table for authorization.
- **Owner (main admin)**: manually provisioned once; cannot be removed; only owner can add/remove other admins (max 5 total).
- **CV storage**: public Supabase Storage bucket; each upload is stored under a unique object path that includes the application UUID while preserving the original filename.
- **Exports**: per-form only; admin selects rows and downloads CSV/XLSX; export includes the CV public URL column.
- **Logs**: action/event logging only (no error logs) in `admin_event_log`.

## Routing map
### Public
- `GET /forms/[slug]`: render the public application form (title/summary/logo/theme).
- `POST /forms/[slug]`: submit application + upload CV (handled via server action or route handler).

### Admin (protected)
- `GET /admin/login`: email/password login form.
- `GET /admin/forgot-password`: request password reset email.
- `GET /admin/reset-password`: set new password after Supabase reset link redirect.
- `GET /admin`: dashboard home (KPI widgets load-once + manual refresh).
- `GET /admin/forms`: list forms + create form.
- `GET /admin/forms/[slug]`: form details + submissions table + export.
- `GET /admin/forms/[slug]/edit`: edit title/summary/logo/theme and active state.
- `GET /admin/admins`: list admins; owner can add/remove.
- `GET /admin/logs`: admin event log viewer (simple, paginated).

## Folder structure
### `src/app`
- `src/app/forms/[slug]/...`: public form routes (server components) and submission handlers.
- `src/app/admin/...`: admin routes (server components) and route handlers for export/delete/admin management.
- `src/app/api/...` (only if needed): small API endpoints for file download/export and admin actions when a Server Action is not suitable.

### `src/components`
Reusable UI components (forms, tables, inputs, buttons) without business logic.

### `src/lib`
Single source of truth for cross-cutting logic:
- `supabase/`: SSR and browser client builders.
- `auth/`: session lookup + `admins` allowlist checks + owner checks.
- `validation/`: zod schemas for admin forms and applicant submission.
- `slug/`: normalization rules for slugs.
- `export/`: CSV/XLSX generation helpers.
- `logging/`: admin event log helper (single entry point).

## Security model (v1)
- All mutations happen server-side and re-check authorization (even if UI is protected).
- RLS policies protect tables; Storage bucket is public by design for v1.
- Service-role credentials (if used for admin creation/deletion) exist only server-side and are never exposed to the browser.

