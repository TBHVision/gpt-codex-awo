-- AWO-6 manual smoke checks for RLS policy presence and table protection.
-- Run against the linked Supabase project after migrations are applied:
--
--   npx supabase db dump --help
--
-- For now, this file documents the checks Codex runs through catalog queries.

select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'artists',
    'cards',
    'card_media',
    'people',
    'occasions',
    'carts',
    'cart_items',
    'orders',
    'order_items',
    'honoree_reveals',
    'admin_audit_events'
  )
order by tablename;

select
  schemaname,
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
