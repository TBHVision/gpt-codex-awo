-- AWO-8 follow-up: publish catalog through views instead of direct anon table
-- reads. This avoids expensive or recursive policy paths on the raw cards table.

drop policy if exists "cards_select_public_owner_or_admin" on public.cards;

create policy "cards_select_artist_owner"
on public.cards
for select
to authenticated
using (artist_id = public.current_user_artist_id());

create policy "cards_select_admin"
on public.cards
for select
to authenticated
using (public.current_user_is_admin());

create or replace view public.published_cards
with (security_invoker = false)
as
select
  c.id,
  c.artist_id,
  a.public_name as artist_name,
  a.slug as artist_slug,
  c.title,
  c.slug,
  c.description,
  c.occasion_tags,
  c.recipient_tags,
  c.price_cents,
  c.currency,
  c.cover_media_url,
  c.published_at
from public.cards c
join public.artists a on a.id = c.artist_id
where c.status = 'published'
  and a.status = 'approved';

grant select on public.published_cards to anon, authenticated;
