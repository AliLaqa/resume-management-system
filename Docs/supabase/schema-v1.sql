-- Resume Management System (v1) - Supabase SQL schema
-- Run this in the Supabase SQL Editor for your project.

-- Extensions
create extension if not exists pgcrypto;

-- Helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- RLS role helpers (avoid self-referential policy recursion)
-- These SECURITY DEFINER functions allow policies to check admin/owner status safely.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  );
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
      and a.is_owner = true
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_owner() to anon, authenticated;

-- -----------------------------
-- Tables
-- -----------------------------

-- Saved forms (job openings)
create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  summary text,
  logo_object_path text,
  header_color text not null default 'zinc',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists forms_slug_unique on public.forms (slug);

create trigger set_forms_updated_at
before update on public.forms
for each row execute function public.set_updated_at();

-- Applications submitted for a form
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete restrict,

  -- fixed applicant fields (v1)
  name text not null,
  cnic text not null,
  degree text not null,
  specialization text not null,
  years_experience int not null,
  previous_organization text not null,
  remarks text,

  -- CV storage metadata (public link in v1)
  cv_object_path text,
  cv_public_url text,
  cv_original_filename text,
  cv_mime_type text,
  cv_size_bytes bigint,

  created_at timestamptz not null default now()
);

create index if not exists applications_form_id_idx on public.applications(form_id);
create index if not exists applications_created_at_idx on public.applications(created_at desc);

-- Admin allowlist (authorization)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_owner boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists admins_is_owner_idx on public.admins(is_owner);

-- Admin event logs (actions only, no error logs)
create table if not exists public.admin_event_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_event_log_created_at_idx on public.admin_event_log(created_at desc);
create index if not exists admin_event_log_actor_idx on public.admin_event_log(actor_user_id, created_at desc);
create index if not exists admin_event_log_entity_idx on public.admin_event_log(entity_type, entity_id);

-- -----------------------------
-- Admin cap + owner protection
-- -----------------------------

-- Enforce:
-- - max 5 admins total
-- - owner cannot be removed
create or replace function public.enforce_admin_rules()
returns trigger
language plpgsql
as $$
declare
  admins_count int;
begin
  if (tg_op = 'INSERT') then
    select count(*) into admins_count from public.admins;
    if admins_count >= 5 then
      raise exception 'Admin cap reached (max 5).';
    end if;
    return new;
  end if;

  if (tg_op = 'DELETE') then
    if old.is_owner then
      raise exception 'Owner admin cannot be removed.';
    end if;

    select count(*) into admins_count from public.admins;
    if admins_count <= 1 then
      raise exception 'Cannot remove the last remaining admin.';
    end if;
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists admins_enforce_rules_insert on public.admins;
create trigger admins_enforce_rules_insert
before insert on public.admins
for each row execute function public.enforce_admin_rules();

drop trigger if exists admins_enforce_rules_delete on public.admins;
create trigger admins_enforce_rules_delete
before delete on public.admins
for each row execute function public.enforce_admin_rules();

-- Ensure at most one owner (recommended safeguard)
create unique index if not exists admins_single_owner_unique on public.admins ((is_owner))
where is_owner = true;

-- -----------------------------
-- Row Level Security (RLS)
-- -----------------------------

alter table public.forms enable row level security;
alter table public.applications enable row level security;
alter table public.admins enable row level security;
alter table public.admin_event_log enable row level security;

-- Forms
-- Public can read active forms for rendering public pages
drop policy if exists "forms_public_read_active" on public.forms;
create policy "forms_public_read_active"
on public.forms
for select
to anon, authenticated
using (is_active = true);

-- Admins can read all forms
drop policy if exists "forms_admin_read_all" on public.forms;
create policy "forms_admin_read_all"
on public.forms
for select
to authenticated
using ((select public.is_admin()));

-- Admins can insert/update forms
drop policy if exists "forms_admin_insert" on public.forms;
create policy "forms_admin_insert"
on public.forms
for insert
to authenticated
with check ((select public.is_admin()));

drop policy if exists "forms_admin_update" on public.forms;
create policy "forms_admin_update"
on public.forms
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Applications
-- Anyone can submit an application to an active form (public insert)
drop policy if exists "applications_public_insert" on public.applications;
create policy "applications_public_insert"
on public.applications
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.forms f
    where f.id = form_id
      and f.is_active = true
  )
);

-- Admins can read applications
drop policy if exists "applications_admin_read" on public.applications;
create policy "applications_admin_read"
on public.applications
for select
to authenticated
using ((select public.is_admin()));

-- Only owner can delete applications
drop policy if exists "applications_owner_delete" on public.applications;
create policy "applications_owner_delete"
on public.applications
for delete
to authenticated
using ((select public.is_owner()));

-- Admins
-- Any admin can read admins list (UI)
drop policy if exists "admins_admin_read" on public.admins;
create policy "admins_admin_read"
on public.admins
for select
to authenticated
using ((select public.is_admin()));

-- Only owner can insert/delete other admins
drop policy if exists "admins_owner_insert" on public.admins;
create policy "admins_owner_insert"
on public.admins
for insert
to authenticated
with check ((select public.is_owner()));

drop policy if exists "admins_owner_delete" on public.admins;
create policy "admins_owner_delete"
on public.admins
for delete
to authenticated
using ((select public.is_owner()) and user_id <> auth.uid());

-- Admin event log
-- Admins can read logs
drop policy if exists "admin_event_log_admin_read" on public.admin_event_log;
create policy "admin_event_log_admin_read"
on public.admin_event_log
for select
to authenticated
using ((select public.is_admin()));

-- No direct inserts from client (logs should be written server-side with service role, or via a dedicated RPC if preferred)
-- If you want authenticated admins to insert directly via RLS, add a policy:
-- create policy "admin_event_log_admin_insert" on public.admin_event_log for insert to authenticated with check (exists (...));

-- -----------------------------
-- Data API Grants (explicit)
-- -----------------------------
-- Supabase is moving towards opt-in exposure of tables/functions through the Data API.
-- If grants are missing, PostgREST returns 42501 "permission denied for table ...".
-- Keep GRANTs alongside RLS so the effective access is clear.

grant usage on schema public to anon, authenticated, service_role;

-- forms
grant select on table public.forms to anon;
grant select, insert, update, delete on table public.forms to authenticated;
grant select, insert, update, delete on table public.forms to service_role;

-- applications
grant insert on table public.applications to anon;
grant select, insert, update, delete on table public.applications to authenticated;
grant select, insert, update, delete on table public.applications to service_role;

-- admins (no anon access)
grant select, insert, update, delete on table public.admins to authenticated;
grant select, insert, update, delete on table public.admins to service_role;

-- admin_event_log (writes server-side via service_role)
grant select on table public.admin_event_log to authenticated;
grant select, insert, update, delete on table public.admin_event_log to service_role;

-- -----------------------------
-- Storage buckets (public v1)
-- -----------------------------

-- Buckets are created by inserting into storage.buckets.
-- Note: If you prefer, you can also create buckets in the Supabase Dashboard UI instead of SQL.

insert into storage.buckets (id, name, public)
values
  ('rms-cv', 'rms-cv', true),
  ('rms-logos', 'rms-logos', true)
on conflict (id) do nothing;

-- Public access to objects in these buckets is enabled because buckets are public.
