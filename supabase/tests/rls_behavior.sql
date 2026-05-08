-- AWO-6 rollback-only RLS behavior checks.
-- Run with:
--   npm run supabase -- db query --linked --file supabase/tests/rls_behavior.sql --output json
--
-- It should return five rows with `passed = true`. It should not be pushed as
-- a migration.

begin;

create temp table rls_test_results (
  check_name text primary key,
  passed boolean not null,
  observed_count integer not null
);

grant insert, select on rls_test_results to anon, authenticated;

insert into auth.users (id, aud, role, email)
values
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'buyer1@example.test'),
  ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'buyer2@example.test'),
  ('10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'artist@example.test'),
  ('10000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'admin@example.test');

insert into public.profiles (id, role, display_name, email)
values
  ('10000000-0000-0000-0000-000000000001', 'buyer', 'Buyer One', 'buyer1@example.test'),
  ('10000000-0000-0000-0000-000000000002', 'buyer', 'Buyer Two', 'buyer2@example.test'),
  ('10000000-0000-0000-0000-000000000003', 'artist', 'Artist One', 'artist@example.test'),
  ('10000000-0000-0000-0000-000000000004', 'admin', 'Admin One', 'admin@example.test');

insert into public.artists (id, profile_id, status, public_name, slug)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'approved', 'Approved Artist', 'approved-artist');

insert into public.cards (id, artist_id, status, title, slug, price_cents)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'published', 'Published Card', 'published-card', 500),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'draft', 'Draft Card', 'draft-card', 500);

insert into public.people (id, owner_profile_id, display_name)
values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Buyer One Person'),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Buyer Two Person');

set local role anon;

insert into rls_test_results
select 'anon sees only published cards', count(*) = 1, count(*)
from public.cards;

insert into rls_test_results
select 'anon cannot see people', count(*) = 0, count(*)
from public.people;

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;

insert into rls_test_results
select 'buyer sees only own people', count(*) = 1, count(*)
from public.people;

insert into rls_test_results
select 'buyer sees only public cards', count(*) = 1, count(*)
from public.cards;

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
set local role authenticated;

insert into rls_test_results
select 'artist sees own public and draft cards', count(*) = 2, count(*)
from public.cards;

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
set local role authenticated;

insert into rls_test_results
select 'admin sees all people', count(*) = 2, count(*)
from public.people;

insert into rls_test_results
select 'admin sees all cards', count(*) = 2, count(*)
from public.cards;

reset role;

select *
from rls_test_results
order by check_name;

rollback;
