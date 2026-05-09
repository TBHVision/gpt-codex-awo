-- AWO-8 follow-up: remove recursive card public-read helper.
--
-- The first RLS policy layer used public.card_is_public(id) inside the cards
-- SELECT policy. That helper queried public.cards again, which can recurse when
-- the anon role reads the catalog. Keep the policy expression direct on cards
-- and reserve helper functions for other tables.

drop policy if exists "cards_select_public_owner_or_admin" on public.cards;

create policy "cards_select_public_owner_or_admin"
on public.cards
for select
using (
  status = 'published'
  or artist_id = public.current_user_artist_id()
  or public.current_user_is_admin()
);
