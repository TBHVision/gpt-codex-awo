-- AWO-5: initial GPT-Codex AWO schema.
-- RLS is enabled on every app table. Access policies are added in AWO-6.

create extension if not exists pgcrypto;

create type public.profile_role as enum ('buyer', 'artist', 'admin');
create type public.artist_status as enum ('draft', 'pending_review', 'approved', 'suspended');
create type public.card_status as enum ('draft', 'pending_review', 'approved', 'published', 'retired', 'rejected');
create type public.media_kind as enum ('image', 'video', 'audio', 'document');
create type public.cart_status as enum ('active', 'converted', 'abandoned');
create type public.order_status as enum ('draft', 'pending_payment', 'paid', 'fulfilled', 'canceled', 'refunded');
create type public.reveal_status as enum ('not_started', 'opened', 'completed', 'locked');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.profile_role not null default 'buyer',
  display_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.artists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  status public.artist_status not null default 'draft',
  public_name text not null,
  slug text not null unique,
  bio text,
  website_url text,
  payout_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete restrict,
  status public.card_status not null default 'draft',
  title text not null,
  slug text not null unique,
  description text,
  occasion_tags text[] not null default '{}',
  recipient_tags text[] not null default '{}',
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD',
  cover_media_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.card_media (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  kind public.media_kind not null,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null,
  relationship text,
  birthday date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.occasions (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  person_id uuid references public.people(id) on delete cascade,
  title text not null,
  occasion_date date,
  reminder_days_before integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references public.profiles(id) on delete set null,
  anonymous_id text,
  status public.cart_status not null default 'active',
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  converted_order_id uuid
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete restrict,
  person_id uuid references public.people(id) on delete set null,
  occasion_id uuid references public.occasions(id) on delete set null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_profile_id uuid references public.profiles(id) on delete set null,
  status public.order_status not null default 'draft',
  currency text not null default 'USD',
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  checkout_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.carts
  add constraint carts_converted_order_id_fkey
  foreign key (converted_order_id) references public.orders(id) on delete set null;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete restrict,
  artist_id uuid not null references public.artists(id) on delete restrict,
  person_id uuid references public.people(id) on delete set null,
  occasion_id uuid references public.occasions(id) on delete set null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  line_total_cents integer not null check (line_total_cents >= 0),
  reveal_public_id text not null unique default replace(gen_random_uuid()::text, '-', ''),
  reveal_pin_hash text,
  created_at timestamptz not null default now()
);

create table public.honoree_reveals (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null unique references public.order_items(id) on delete cascade,
  status public.reveal_status not null default 'not_started',
  first_opened_at timestamptz,
  completed_at timestamptz,
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  last_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index artists_profile_id_idx on public.artists(profile_id);
create index cards_artist_id_idx on public.cards(artist_id);
create index cards_status_idx on public.cards(status);
create index card_media_card_id_idx on public.card_media(card_id);
create index people_owner_profile_id_idx on public.people(owner_profile_id);
create index occasions_owner_profile_id_idx on public.occasions(owner_profile_id);
create index occasions_person_id_idx on public.occasions(person_id);
create index carts_owner_profile_id_idx on public.carts(owner_profile_id);
create index cart_items_cart_id_idx on public.cart_items(cart_id);
create index orders_buyer_profile_id_idx on public.orders(buyer_profile_id);
create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_reveal_public_id_idx on public.order_items(reveal_public_id);
create index admin_audit_events_actor_profile_id_idx on public.admin_audit_events(actor_profile_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger artists_set_updated_at
before update on public.artists
for each row execute function public.set_updated_at();

create trigger cards_set_updated_at
before update on public.cards
for each row execute function public.set_updated_at();

create trigger people_set_updated_at
before update on public.people
for each row execute function public.set_updated_at();

create trigger occasions_set_updated_at
before update on public.occasions
for each row execute function public.set_updated_at();

create trigger carts_set_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create trigger honoree_reveals_set_updated_at
before update on public.honoree_reveals
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.artists enable row level security;
alter table public.cards enable row level security;
alter table public.card_media enable row level security;
alter table public.people enable row level security;
alter table public.occasions enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.honoree_reveals enable row level security;
alter table public.admin_audit_events enable row level security;
