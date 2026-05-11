-- AWO-51: align the demo catalog with the five-card storefront pre-visualization.

insert into public.cards (
  id,
  artist_id,
  status,
  title,
  slug,
  description,
  occasion_tags,
  recipient_tags,
  price_cents,
  currency,
  cover_media_url,
  published_at
)
values
  (
    '92000000-0000-0000-0000-000000000001',
    '91000000-0000-0000-0000-000000000001',
    'published',
    'Wildflower Notes',
    'wildflower-notes',
    'A gentle floral note card inspired by hand-painted wildflowers.',
    array['originals', 'thanks'],
    array['friend', 'family'],
    550,
    'USD',
    '/cards/wildflower-notes.svg',
    now()
  ),
  (
    '92000000-0000-0000-0000-000000000002',
    '91000000-0000-0000-0000-000000000001',
    'published',
    'Coastal Morning',
    'coastal-morning',
    'A calm coastal landscape card for meaningful everyday connection.',
    array['sympathy', 'support'],
    array['friend', 'family'],
    650,
    'USD',
    '/cards/coastal-morning.svg',
    now() - interval '1 minute'
  ),
  (
    '92000000-0000-0000-0000-000000000003',
    '91000000-0000-0000-0000-000000000001',
    'published',
    'With All My Heart',
    'with-all-my-heart',
    'An expressive abstract card for love, gratitude, and close connection.',
    array['love', 'thanks', 'originals'],
    array['partner', 'friend', 'family'],
    550,
    'USD',
    '/cards/with-all-my-heart.svg',
    now() - interval '2 minutes'
  ),
  (
    '92000000-0000-0000-0000-000000000004',
    '91000000-0000-0000-0000-000000000001',
    'published',
    'Morning Song',
    'morning-song',
    'A bright comic-inspired birthday card with joyful color and motion.',
    array['birthday', 'celebration'],
    array['friend', 'family'],
    550,
    'USD',
    '/cards/morning-song.svg',
    now() - interval '3 minutes'
  ),
  (
    '92000000-0000-0000-0000-000000000005',
    '91000000-0000-0000-0000-000000000001',
    'published',
    'Misty Pines',
    'misty-pines',
    'A vivid original card with swirling forest color and playful detail.',
    array['birthday', 'originals'],
    array['friend', 'artist'],
    650,
    'USD',
    '/cards/misty-pines.svg',
    now() - interval '4 minutes'
  )
on conflict (id) do update
set
  artist_id = excluded.artist_id,
  status = excluded.status,
  title = excluded.title,
  slug = excluded.slug,
  description = excluded.description,
  occasion_tags = excluded.occasion_tags,
  recipient_tags = excluded.recipient_tags,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  cover_media_url = excluded.cover_media_url,
  published_at = excluded.published_at,
  updated_at = now();
