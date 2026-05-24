-- Resume Management System (v1) - explicit Data API grants
-- Run this in Supabase SQL Editor if you see "permission denied for table ..." (42501)
-- even though your RLS policies are correct.
--
-- Background: Supabase is moving towards opt-in Data API exposure. That means new tables
-- may not be reachable through PostgREST until you explicitly GRANT privileges.

grant usage on schema public to anon, authenticated, service_role;

-- forms
grant select on table public.forms to anon;
grant select, insert, update, delete on table public.forms to authenticated;
grant select, insert, update, delete on table public.forms to service_role;

-- applications
grant insert on table public.applications to anon;
grant select, insert, update, delete on table public.applications to authenticated;
grant select, insert, update, delete on table public.applications to service_role;

-- admins (no anon access; controlled by RLS + RPCs)
grant select, insert, update, delete on table public.admins to authenticated;
grant select, insert, update, delete on table public.admins to service_role;

-- admin_event_log (client reads allowed by RLS, writes should be server-side)
grant select on table public.admin_event_log to authenticated;
grant select, insert, update, delete on table public.admin_event_log to service_role;

