-- AWO-8: demo catalog seed.
-- This is fake demo data for local/preview development. Do not use real
-- customer, artist, or payment data here.

insert into auth.users (id, aud, role, email, email_confirmed_at)
values (
  '90000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'demo.artist@example.test',
  now()
)
on conflict (id) do nothing;

insert into public.profiles (id, role, display_name, email)
values (
  '90000000-0000-0000-0000-000000000001',
  'artist',
  'HatchVision Studio',
  'demo.artist@example.test'
)
on conflict (id) do update
set
  role = excluded.role,
  display_name = excluded.display_name,
  email = excluded.email,
  updated_at = now();

insert into public.artists (
  id,
  profile_id,
  status,
  public_name,
  slug,
  bio,
  website_url
)
values (
  '91000000-0000-0000-0000-000000000001',
  '90000000-0000-0000-0000-000000000001',
  'approved',
  'HatchVision Studio',
  'hatchvision-studio',
  'Demo artist profile for GPT-Codex AWO development.',
  'https://hatchvision.com'
)
on conflict (id) do update
set
  status = excluded.status,
  public_name = excluded.public_name,
  slug = excluded.slug,
  bio = excluded.bio,
  website_url = excluded.website_url,
  updated_at = now();

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
    'Birthday Light',
    'birthday-light',
    'A bright demo birthday card for shop browsing and card detail testing.',
    array['birthday', 'celebration'],
    array['friend', 'family'],
    599,
    'USD',
    null,
    now()
  ),
  (
    '92000000-0000-0000-0000-000000000002',
    '91000000-0000-0000-0000-000000000001',
    'published',
    'Keep Going',
    'keep-going',
    'A supportive demo card for encouragement and milestone moments.',
    array['encouragement', 'milestone'],
    array['coworker', 'friend'],
    599,
    'USD',
    null,
    now()
  ),
  (
    '92000000-0000-0000-0000-000000000003',
    '91000000-0000-0000-0000-000000000001',
    'published',
    'With You',
    'with-you',
    'A calm demo support card for sympathy and difficult seasons.',
    array['support', 'sympathy'],
    array['family', 'friend'],
    699,
    'USD',
    null,
    now()
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
