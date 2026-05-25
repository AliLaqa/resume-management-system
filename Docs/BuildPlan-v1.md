# resume-management-system

This project is a simple web app to collect job applications through shareable links.
Applicants fill a form and attach their CV, then the submission is saved securely online.
Admins can review submissions, download CVs, and export selected entries as Excel/CSV.
Each job opening has its own saved form page with its own title, summary, logo, and colors.

## KPIs
- Total number of forms created (saved forms)
- Total number of applications received per form
- % of submissions with CV attached
- Total number of exports generated (CSV/XLSX) per form
- Total number of CV downloads from the dashboard
- Total number of admin accounts (must stay ≤ 5)

## Functionalities

### Public job application form (per saved form)
Each form has a required slug (normalized) and a public shareable page where applicants submit the fixed fields + CV.

### Fixed application fields (non-editable)
The applicant fields remain consistent across all forms: Name, CNIC, Degree, Area of Specialization, Years of Experience, Notable Previous Organization, Remarks, and CV Attach.

### CV upload to Supabase Storage (public link)
CVs are uploaded as PDF/DOC/DOCX to a public Storage bucket using a unique object path; the application record stores the public URL + file metadata.

### Admin authentication (Supabase Auth: email + password)
Admins sign in with email/password only, and can reset password via the Supabase password reset flow.

### Admin authorization (single-level allowlist)
Only users present in the `admins` table can access the dashboard; there is no multi-role hierarchy beyond “owner” rules.

### Admin dashboard (forms + submissions)
Admins can create/edit saved forms, view per-form submissions, open application details, and download CVs via stored public links.

### Export submissions (per form, selectable rows)
Admins can select specific submissions for a form and export those rows as CSV or XLSX including the CV download URL column.

### Admin event logging (actions only)
Log only key admin actions (no error logs) with consistent action names, timestamps, actor, and affected entity references.

### Admin management (up to 5 admins, owner-controlled)
The manually-provisioned owner can add up to 4 more admins (max 5 total) and remove non-owner admins; non-owner admins cannot manage admins.

### Application + CV deletion (owner-only)
Only the owner can delete application submissions, and deletion also removes the associated CV file from Storage.

## What not to implement (v1 scope guardrails)
- Do not make application fields configurable/editable per form (fields are fixed).
- Do not implement multiple permission tiers (no “super admin/admin/operator” hierarchy).
- Do not implement applicant accounts, applicant login, or applicant dashboards.
- Do not implement email verification or 2FA for admins.
- Do not implement private buckets or signed URLs for CVs (CV links are public in v1).
- Do not implement global exports across all forms (exports are per form only).
- Do not implement storage usage analytics (DB/bucket remaining space) in v1.
- Do not implement error logging systems; only action/event logging is in scope.
- Do not implement automated file size caps beyond any inherent platform limits.

## Build plan (v1)

### Step A — Requirements, conventions, and project wiring  [Implemented] [Not Tested]
Documented v1 requirements and conventions to keep implementation consistent and DRY.
#### Step A.1 — Confirm fixed field schema + labels  [Implemented] [Tested]
Locked the fixed application fields to match the client’s spreadsheet screenshot.
#### Step A.2 — Decide naming conventions (tables, actions, slugs, paths)  [Implemented] [Tested]
Standardized naming for tables, admin event actions, slugs, and Storage object paths.
#### Step A.3 — Define public URLs and admin URLs routing map  [Implemented] [Tested]
Defined a stable routing map for public forms by slug and protected admin dashboard pages.
#### Step A.4 — Define “owner” rules and admin cap rules  [Implemented] [Not Tested]
Defined owner-only capabilities (admin management + deletion) and the 5-admin cap rule.

### Step B — Supabase setup (DB, Storage, Auth)  [Implemented] [Not Tested]
Created Supabase SQL for v1 tables, RLS policies, triggers, and bucket setup (to be applied in the Supabase SQL Editor).
#### Step B.1 — Create tables: `forms`, `applications`, `admins`, `admin_event_log`  [Implemented] [Tested]
Implemented the initial v1 database schema in `Docs/supabase/schema-v1.sql`.
#### Step B.2 — Add indexes + constraints (unique slug, FK `applications.form_id`, admin cap enforcement)  [Implemented] [Tested]
Added uniqueness, foreign keys, indexes, and DB-side safeguards for the admin cap/owner rules.
#### Step B.3 — Enable RLS and add policies for  [Implemented] [Not Tested]
Enabled RLS and defined policies to allow public submission while protecting admin-only data access.
- `forms`: readable for public form rendering (only what’s needed) + writable for admins
- `applications`: public insert for submissions + admin read; owner-only delete
- `admins`: admin read; owner-only add/remove; protect owner from deletion
- `admin_event_log`: admin read; server-only insert
#### Step B.4 — Create public Storage bucket for CVs + access rules  [Implemented] [Tested]
Created public buckets for CVs and form logos (`rms-cv`, `rms-logos`) in `Docs/supabase/schema-v1.sql`.
#### Step B.5 — Manually provision owner admin (Supabase Auth user + SQL insert into `admins` as owner)  [Implemented] [Tested]
Added `Docs/supabase/seed-v1.sql` to insert the owner into `admins` after creating the Auth user in Supabase.
#### Step B.6 — Configure Supabase Auth password reset redirect URLs (local + Vercel)  [Implemented] [Not Tested]
Documented the required Supabase Auth settings in `Docs/supabase/config-v1.md`.

### Step C — Public form experience (applicants)  [Implemented] [Tested]
Implemented the public form page and submission flow using a Server Action and Supabase (service-role) writes.
#### Step C.1 — Public form page by slug (read form config, show title/summary/logo/theme)  [Implemented] [Tested]
Added `src/app/forms/[slug]/page.tsx` to render an active form using saved config (title/summary/logo/header color).
#### Step C.2 — Form submit: validate required fields minimally + create `applications` row  [Implemented] [Tested]
Implemented `submitApplication` Server Action with zod validation and inserts into `applications`.
#### Step C.3 — CV upload: store under `applications/<application_id>/<original_filename>` and save `cv_*` metadata + public URL  [Implemented] [Tested]
Uploads CV to bucket `rms-cv` under `applications/<uuid>/<original_filename>` and stores the public URL + file metadata.
#### Step C.4 — Success/confirmation screen (no applicant account)  [Implemented] [Tested]
Shows an inline success message and disables re-submission after a successful submit (no applicant accounts).

### Step D — Admin authentication and dashboard shell  [Implemented] [Tested]
Implemented admin auth pages and a protected dashboard shell that gates access via Supabase Auth + `admins` allowlist.
#### Step D.1 — Admin login (email + password) + “forgot password” flow  [Implemented] [Tested]
Added `/admin/login`, `/admin/forgot-password`, and `/admin/reset-password` flows using Supabase Auth.
#### Step D.2 — Admin route protection (check session + `admins` allowlist)  [Implemented] [Tested]
Protected dashboard routes via `requireAdmin()` (session + `admins` table check) and added `/admin/unauthorized`.
#### Step D.3 — Dashboard layout/navigation (Forms, Submissions, Admins, Logs)  [Implemented] [Tested]
Added a shared dashboard layout with navigation and logout action under `src/app/admin/(dashboard)`.
#### Step D.4 — KPI widgets load-once + manual Refresh (no auto-refresh)  [Implemented] [Tested]
Dashboard KPIs render server-side on page load and include a manual Refresh button (no polling/auto-refresh).

### Step E — Form management (admin)  [Implemented] [Not Tested]
Implemented form creation, editing, theming, and active toggling in the admin dashboard.
#### Step E.1 — Create form (required slug; normalize slug; enforce uniqueness)  [Implemented] [Tested]
Added `/admin/forms` create form UI and server action that normalizes slug and inserts into `forms`.
#### Step E.2 — Edit form (title, summary, optional logo, theme color selections)  [Implemented] [Tested]
Added `/admin/forms/[slug]/edit` to update form metadata and upload/replace an optional logo in `rms-logos`.
#### Step E.3 — Publish/unpublish or active toggle (controls public availability)  [Implemented] [Tested]
Implemented `is_active` toggle in edit UI; public form route only renders active forms.
#### Step E.4 — Record admin event logs for form actions (`form.created`, `form.updated`, `form.published`, `form.unpublished`)  [Implemented] [Tested]
Logs are written for create/update, publishing is logged when `is_active` transitions to true, and unpublishing is logged when `is_active` transitions to false.
#### Step E.5 — Hard delete form (only when safe; no submissions)  [Not Implemented] [Not Tested]
Allow hard deletion only if the form has zero submissions. If submissions exist, block deletion and instruct the admin to delete submissions first (or export them), then delete the form. This aligns with the DB constraint (`applications.form_id` uses `on delete restrict`), which prevents deleting a form that has related applications.
#### Step E.6 — Logo removal + safe replacement cleanup  [Implemented] [Tested]
Add a small “remove logo” (cross icon) action on the edit form screen that deletes the currently stored logo object (no confirmation prompt) and clears the form’s logo fields. When uploading a new logo for a form that already has one, delete the previous stored logo object first, then upload/save the new logo (avoid orphaned files).

### Step F — Submission review (admin)  [Implemented] [Tested]
Implemented per-form submissions viewing, application detail pages, and CV downloads via a logging redirect route.
#### Step F.1 — Submissions list per form (table view with all fields + CV URL)  [Implemented] [Tested]
Added `/admin/forms/[slug]` with a selectable submissions table showing all fixed fields and CV attach link.
#### Step F.2 — Submission detail view (single application)  [Implemented] [Tested]
Added `/admin/forms/[slug]/applications/[id]` for a clean detail view of one application.
#### Step F.3 — CV download action (use stored public URL) + log (`cv.downloaded`)  [Implemented] [Tested]
Added `/admin/cv?applicationId=...` to log the download event and redirect to the stored public CV URL.
#### Step F.4 — “Viewed” logging (`application.viewed`) with minimal noise control  [Implemented] [Tested]
Application detail view writes an `application.viewed` log on page load (1 log per view request).

### Step G — Export (admin, per form, selectable rows)  [Implemented] [Tested]
Implemented per-form exports for selected submissions as CSV or XLSX with the CV public URL column included.
#### Step G.1 — UI selection model (select rows, select all, export selected)  [Implemented] [Tested]
Added row selection (checkboxes + select all) on the submissions table for export and deletion actions.
#### Step G.2 — CSV export implementation (server-side generation) including CV URL  [Implemented] [Tested]
Added POST `/admin/forms/[slug]/export` to generate CSV with columns matching the client spreadsheet (including CV URL).
#### Step G.3 — XLSX export implementation (server-side generation) including CV URL  [Implemented] [Tested]
Added XLSX export via `exceljs` using the same column set and formatting (header row bold + frozen).
#### Step G.4 — Log exports (`export.csv`, `export.xlsx`) with form id + count exported  [Implemented] [Tested]
Each export writes an event log with form id/slug and the number of rows exported.

### Step H — Admin management (owner-only add/remove; cap 5)  [Implemented] [Not Tested]
Implemented owner-controlled admin invitations/removals with a hard cap of 5 admins enforced in the database.
#### Step H.1 — Admin list UI (read-only for non-owner)  [Implemented] [Tested]
Added `/admin/admins` with a list view; non-owner admins can view the list but cannot modify it.
#### Step H.2 — Owner add admin (create/invite via server-side service-role; insert into `admins`)  [Implemented] [Not Tested]
Owner can invite admins by email using Supabase Admin API (service role) and then insert into `admins`.
#### Step H.3 — Enforce max 5 admins (server + DB-level enforcement to avoid race conditions)  [Implemented] [Not Tested]
DB trigger blocks inserts when admin count is already 5; UI surfaces the insert error message.
#### Step H.4 — Owner remove admin (cannot remove owner; non-owner cannot remove anyone)  [Implemented] [Not Tested]
Owner can remove non-owner admins via dashboard; owner removal is blocked by DB trigger and is not exposed in UI.
#### Step H.5 — Log admin changes (`admin.added`, `admin.removed`)  [Implemented] [Not Tested]
Admin add/remove actions write `admin.added` and `admin.removed` events in `admin_event_log`.

### Step I — Deletion (owner-only)  [Implemented] [Tested]
Implemented owner-only deletion of submissions with best-effort CV file deletion from Supabase Storage.
#### Step I.1 — Owner delete applications (single + bulk selection)  [Implemented] [Tested]
Owner can select rows in `/admin/forms/[slug]` and delete them via POST `/admin/forms/[slug]/delete`.
#### Step I.2 — On delete, remove CV object from Storage (best-effort + transactional consistency)  [Implemented] [Tested]
Delete route removes CV objects from `rms-cv` using the service role key before deleting DB rows.
#### Step I.3 — Log deletions (`application.deleted`, optionally `cv.deleted`)  [Implemented] [Tested]
Deletion writes an `application.deleted` log with form metadata and count of deleted submissions.

### Step J — Testing and release readiness (v1)  [Implemented] [Not Tested]
Prepared v1 manual test and deployment checklists to validate the system end-to-end before production use.
#### Step J.1 — Manual test checklist: public submission, CV upload, admin review, exports, logs  [Implemented] [Not Tested]
Added `Docs/Testing-and-Release-v1.md` with a manual checklist covering the full v1 flow.
#### Step J.2 — RLS verification: public cannot read submissions; only admins can view; only owner can delete/manage admins  [Implemented] [Not Tested]
Documented expected RLS behavior and verification notes in `Docs/Testing-and-Release-v1.md`.
#### Step J.3 — Vercel deployment smoke test (auth redirect URLs, environment vars, exports)  [Implemented] [Not Tested]
Documented required env vars and a deployment smoke test checklist for Vercel in `Docs/Testing-and-Release-v1.md`.
