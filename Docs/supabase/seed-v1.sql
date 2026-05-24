-- Resume Management System (v1) - seed / manual setup helpers
-- Run these after `Docs/supabase/schema-v1.sql`.

-- 1) Create the owner user in Supabase Auth (Dashboard → Authentication → Users).
-- 2) Copy the new user's UUID and paste it below.

-- Insert the owner admin (main admin)
-- Replace: 00000000-0000-0000-0000-000000000000
insert into public.admins (user_id, is_owner)
values ('00000000-0000-0000-0000-000000000000', true)
on conflict (user_id) do update set is_owner = true;

