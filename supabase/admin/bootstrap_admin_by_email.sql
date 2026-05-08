-- AWO-7: one-time admin bootstrap template.
--
-- Usage:
-- 1. Replace `admin@example.com` with the confirmed HatchVision admin email.
-- 2. Run through Supabase SQL editor or `supabase db query --linked`.
-- 3. Do not commit a real email if it should stay private.
--
-- This creates/updates the matching profile row as admin after the auth user
-- exists in Supabase Auth. It does not create the auth user itself.

insert into public.profiles (id, role, email, display_name)
select
  users.id,
  'admin',
  users.email,
  coalesce(users.raw_user_meta_data ->> 'name', users.email)
from auth.users
where lower(users.email) = lower('admin@example.com')
on conflict (id) do update
set
  role = 'admin',
  email = excluded.email,
  display_name = coalesce(public.profiles.display_name, excluded.display_name),
  updated_at = now();

insert into public.admin_audit_events (
  actor_profile_id,
  action,
  entity_table,
  entity_id,
  metadata
)
select
  profiles.id,
  'admin_bootstrap',
  'profiles',
  profiles.id,
  jsonb_build_object('email', profiles.email)
from public.profiles
where lower(profiles.email) = lower('admin@example.com');
