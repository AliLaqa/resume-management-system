-- Patch: Fix admins RLS recursion and make admin authorization reliable (v1)
-- Run this in Supabase SQL Editor if you see "Access Denied" despite being in `public.admins`.
--
-- Why: Avoid self-referential RLS policies (which can cause "infinite recursion detected in policy").
-- This patch adds SECURITY DEFINER helpers and updates policies to use them.

-- 1) SECURITY DEFINER helpers (bypass RLS safely for role checks)
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

-- 2) Replace policies to use the helpers

-- Admins table
drop policy if exists "admins_admin_read" on public.admins;
create policy "admins_admin_read"
on public.admins
for select
to authenticated
using ((select public.is_admin()));

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

-- Forms
drop policy if exists "forms_admin_read_all" on public.forms;
create policy "forms_admin_read_all"
on public.forms
for select
to authenticated
using ((select public.is_admin()));

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
drop policy if exists "applications_admin_read" on public.applications;
create policy "applications_admin_read"
on public.applications
for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "applications_owner_delete" on public.applications;
create policy "applications_owner_delete"
on public.applications
for delete
to authenticated
using ((select public.is_owner()));

-- Admin event log
drop policy if exists "admin_event_log_admin_read" on public.admin_event_log;
create policy "admin_event_log_admin_read"
on public.admin_event_log
for select
to authenticated
using ((select public.is_admin()));

-- 3) Data API Grants (explicit)
-- If you still see 42501 "permission denied for table ..." errors, grants are missing.
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table public.admins to authenticated;
grant select, insert, update, delete on table public.admins to service_role;
