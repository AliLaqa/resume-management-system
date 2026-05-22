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

### Step A — Requirements, conventions, and project wiring  [Not Implemented] [Not Tested]
#### Step A.1 — Confirm fixed field schema + labels  [Not Implemented] [Not Tested]
#### Step A.2 — Decide naming conventions (tables, actions, slugs, paths)  [Not Implemented] [Not Tested]
#### Step A.3 — Define public URLs and admin URLs routing map  [Not Implemented] [Not Tested]
#### Step A.4 — Define “owner” rules and admin cap rules  [Not Implemented] [Not Tested]

### Step B — Supabase setup (DB, Storage, Auth)  [Not Implemented] [Not Tested]
#### Step B.1 — Create tables: `forms`, `applications`, `admins`, `admin_event_log`  [Not Implemented] [Not Tested]
#### Step B.2 — Add indexes + constraints (unique slug, FK `applications.form_id`, admin cap enforcement)  [Not Implemented] [Not Tested]
#### Step B.3 — Enable RLS and add policies for:
- `forms`: readable for public form rendering (only what’s needed) + writable for admins
- `applications`: public insert for submissions + admin read; owner-only delete
- `admins`: admin read; owner-only add/remove; protect owner from deletion
- `admin_event_log`: admin read; server-only insert
[Not Implemented] [Not Tested]
#### Step B.4 — Create public Storage bucket for CVs + access rules  [Not Implemented] [Not Tested]
#### Step B.5 — Manually provision owner admin (Supabase Auth user + SQL insert into `admins` as owner)  [Not Implemented] [Not Tested]
#### Step B.6 — Configure Supabase Auth password reset redirect URLs (local + Vercel)  [Not Implemented] [Not Tested]

### Step C — Public form experience (applicants)  [Not Implemented] [Not Tested]
#### Step C.1 — Public form page by slug (read form config, show title/summary/logo/theme)  [Not Implemented] [Not Tested]
#### Step C.2 — Form submit: validate required fields minimally + create `applications` row  [Not Implemented] [Not Tested]
#### Step C.3 — CV upload: store under `applications/<application_id>/<original_filename>` and save `cv_*` metadata + public URL  [Not Implemented] [Not Tested]
#### Step C.4 — Success/confirmation screen (no applicant account)  [Not Implemented] [Not Tested]

### Step D — Admin authentication and dashboard shell  [Not Implemented] [Not Tested]
#### Step D.1 — Admin login (email + password) + “forgot password” flow  [Not Implemented] [Not Tested]
#### Step D.2 — Admin route protection (check session + `admins` allowlist)  [Not Implemented] [Not Tested]
#### Step D.3 — Dashboard layout/navigation (Forms, Submissions, Admins, Logs)  [Not Implemented] [Not Tested]
#### Step D.4 — KPI widgets load-once + manual Refresh (no auto-refresh)  [Not Implemented] [Not Tested]

### Step E — Form management (admin)  [Not Implemented] [Not Tested]
#### Step E.1 — Create form (required slug; normalize slug; enforce uniqueness)  [Not Implemented] [Not Tested]
#### Step E.2 — Edit form (title, summary, optional logo, theme color selections)  [Not Implemented] [Not Tested]
#### Step E.3 — Publish/unpublish or active toggle (controls public availability)  [Not Implemented] [Not Tested]
#### Step E.4 — Record admin event logs for form actions (`form.created`, `form.updated`, `form.published`)  [Not Implemented] [Not Tested]

### Step F — Submission review (admin)  [Not Implemented] [Not Tested]
#### Step F.1 — Submissions list per form (table view with all fields + CV URL)  [Not Implemented] [Not Tested]
#### Step F.2 — Submission detail view (single application)  [Not Implemented] [Not Tested]
#### Step F.3 — CV download action (use stored public URL) + log (`cv.downloaded`)  [Not Implemented] [Not Tested]
#### Step F.4 — “Viewed” logging (`application.viewed`) with minimal noise control  [Not Implemented] [Not Tested]

### Step G — Export (admin, per form, selectable rows)  [Not Implemented] [Not Tested]
#### Step G.1 — UI selection model (select rows, select all, export selected)  [Not Implemented] [Not Tested]
#### Step G.2 — CSV export implementation (server-side generation) including CV URL  [Not Implemented] [Not Tested]
#### Step G.3 — XLSX export implementation (server-side generation) including CV URL  [Not Implemented] [Not Tested]
#### Step G.4 — Log exports (`export.csv`, `export.xlsx`) with form id + count exported  [Not Implemented] [Not Tested]

### Step H — Admin management (owner-only add/remove; cap 5)  [Not Implemented] [Not Tested]
#### Step H.1 — Admin list UI (read-only for non-owner)  [Not Implemented] [Not Tested]
#### Step H.2 — Owner add admin (create/invite via server-side service-role; insert into `admins`)  [Not Implemented] [Not Tested]
#### Step H.3 — Enforce max 5 admins (server + DB-level enforcement to avoid race conditions)  [Not Implemented] [Not Tested]
#### Step H.4 — Owner remove admin (cannot remove owner; non-owner cannot remove anyone)  [Not Implemented] [Not Tested]
#### Step H.5 — Log admin changes (`admin.added`, `admin.removed`)  [Not Implemented] [Not Tested]

### Step I — Deletion (owner-only)  [Not Implemented] [Not Tested]
#### Step I.1 — Owner delete applications (single + bulk selection)  [Not Implemented] [Not Tested]
#### Step I.2 — On delete, remove CV object from Storage (best-effort + transactional consistency)  [Not Implemented] [Not Tested]
#### Step I.3 — Log deletions (`application.deleted`, optionally `cv.deleted`)  [Not Implemented] [Not Tested]

### Step J — Testing and release readiness (v1)  [Not Implemented] [Not Tested]
#### Step J.1 — Manual test checklist: public submission, CV upload, admin review, exports, logs  [Not Implemented] [Not Tested]
#### Step J.2 — RLS verification: public cannot read submissions; only admins can view; only owner can delete/manage admins  [Not Implemented] [Not Tested]
#### Step J.3 — Vercel deployment smoke test (auth redirect URLs, environment vars, exports)  [Not Implemented] [Not Tested]
