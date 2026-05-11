-- AWO-50: attach managed demo artwork assets to the published catalog.

update public.cards
set
  cover_media_url = '/cards/birthday-light.svg',
  updated_at = now()
where id = '92000000-0000-0000-0000-000000000001';

update public.cards
set
  cover_media_url = '/cards/keep-going.svg',
  updated_at = now()
where id = '92000000-0000-0000-0000-000000000002';

update public.cards
set
  cover_media_url = '/cards/with-you.svg',
  updated_at = now()
where id = '92000000-0000-0000-0000-000000000003';
