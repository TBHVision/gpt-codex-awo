-- AWO-45: lifecycle schema for orders, reveals, custody, and ownership.
-- This adds production-grade state surfaces without wiring Stripe or
-- fulfillment automation yet.

create type public.payment_lifecycle_status as enum (
  'not_started',
  'pending',
  'paid',
  'failed',
  'partially_refunded',
  'refunded',
  'canceled'
);

create type public.fulfillment_lifecycle_status as enum (
  'not_started',
  'in_production',
  'fulfilled',
  'canceled'
);

create type public.order_item_status as enum (
  'reserved',
  'purchased',
  'credential_pending',
  'credential_active',
  'revealed',
  'completed',
  'canceled',
  'refunded'
);

create type public.reveal_credential_status as enum (
  'pending_generation',
  'active',
  'opened',
  'completed',
  'locked',
  'expired',
  'revoked',
  'generation_failed'
);

create type public.custody_event_type as enum (
  'artwork_created',
  'evidence_attached',
  'artist_verified',
  'card_approved',
  'card_published',
  'order_paid',
  'item_fulfilled',
  'credential_activated',
  'recipient_revealed',
  'ownership_recorded',
  'credential_revoked'
);

create type public.ownership_status as enum (
  'pending',
  'active',
  'transferred',
  'revoked',
  'refunded',
  'voided'
);

alter table public.orders
  add column if not exists payment_status public.payment_lifecycle_status not null default 'not_started',
  add column if not exists fulfillment_status public.fulfillment_lifecycle_status not null default 'not_started',
  add column if not exists payment_provider text,
  add column if not exists payment_session_id text,
  add column if not exists payment_intent_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists canceled_at timestamptz,
  add column if not exists refunded_at timestamptz;

update public.orders
set
  payment_status = case status
    when 'pending_payment' then 'pending'::public.payment_lifecycle_status
    when 'paid' then 'paid'::public.payment_lifecycle_status
    when 'fulfilled' then 'paid'::public.payment_lifecycle_status
    when 'canceled' then 'canceled'::public.payment_lifecycle_status
    when 'refunded' then 'refunded'::public.payment_lifecycle_status
    else payment_status
  end,
  fulfillment_status = case status
    when 'fulfilled' then 'fulfilled'::public.fulfillment_lifecycle_status
    when 'canceled' then 'canceled'::public.fulfillment_lifecycle_status
    else fulfillment_status
  end,
  paid_at = case
    when status in ('paid', 'fulfilled') and paid_at is null then updated_at
    else paid_at
  end,
  canceled_at = case
    when status = 'canceled' and canceled_at is null then updated_at
    else canceled_at
  end,
  refunded_at = case
    when status = 'refunded' and refunded_at is null then updated_at
    else refunded_at
  end;

alter table public.order_items
  add column if not exists status public.order_item_status not null default 'reserved';

update public.order_items oi
set status = case o.status
  when 'draft' then 'reserved'::public.order_item_status
  when 'pending_payment' then 'reserved'::public.order_item_status
  when 'paid' then 'credential_active'::public.order_item_status
  when 'fulfilled' then 'completed'::public.order_item_status
  when 'canceled' then 'canceled'::public.order_item_status
  when 'refunded' then 'refunded'::public.order_item_status
  else oi.status
end
from public.orders o
where o.id = oi.order_id;

alter table public.honoree_reveals
  add column if not exists credential_status public.reveal_credential_status not null default 'active',
  add column if not exists expires_at timestamptz,
  add column if not exists revoked_at timestamptz,
  add column if not exists revocation_reason text,
  add column if not exists max_failed_attempts integer not null default 5 check (max_failed_attempts > 0);

update public.honoree_reveals
set credential_status = case status
  when 'not_started' then 'active'::public.reveal_credential_status
  when 'opened' then 'opened'::public.reveal_credential_status
  when 'completed' then 'completed'::public.reveal_credential_status
  when 'locked' then 'locked'::public.reveal_credential_status
  else credential_status
end;

create table public.custody_events (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid references public.order_items(id) on delete cascade,
  card_id uuid references public.cards(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  event_type public.custody_event_type not null,
  event_payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint custody_events_subject_required check (
    order_item_id is not null or card_id is not null
  )
);

create table public.ownership_records (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete restrict,
  buyer_profile_id uuid references public.profiles(id) on delete set null,
  recipient_person_id uuid references public.people(id) on delete set null,
  status public.ownership_status not null default 'pending',
  ownership_summary text,
  activated_at timestamptz,
  transferred_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_item_id)
);

create trigger ownership_records_set_updated_at
before update on public.ownership_records
for each row execute function public.set_updated_at();

create index orders_payment_status_idx on public.orders(payment_status);
create index orders_fulfillment_status_idx on public.orders(fulfillment_status);
create index order_items_status_idx on public.order_items(status);
create index honoree_reveals_credential_status_idx on public.honoree_reveals(credential_status);
create index custody_events_order_item_id_idx on public.custody_events(order_item_id);
create index custody_events_card_id_idx on public.custody_events(card_id);
create index custody_events_event_type_idx on public.custody_events(event_type);
create index ownership_records_buyer_profile_id_idx on public.ownership_records(buyer_profile_id);
create index ownership_records_card_id_idx on public.ownership_records(card_id);
create index ownership_records_status_idx on public.ownership_records(status);

alter table public.custody_events enable row level security;
alter table public.ownership_records enable row level security;

create policy "custody_events_select_authorized"
on public.custody_events
for select
using (
  public.current_user_is_admin()
  or exists (
    select 1
    from public.cards c
    where c.id = custody_events.card_id
      and c.artist_id = public.current_user_artist_id()
  )
  or exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.id = custody_events.order_item_id
      and (
        o.buyer_profile_id = auth.uid()
        or oi.artist_id = public.current_user_artist_id()
      )
  )
);

create policy "custody_events_insert_admin"
on public.custody_events
for insert
with check (public.current_user_is_admin());

create policy "custody_events_update_admin"
on public.custody_events
for update
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "ownership_records_select_authorized"
on public.ownership_records
for select
using (
  public.current_user_is_admin()
  or buyer_profile_id = auth.uid()
  or exists (
    select 1
    from public.cards c
    where c.id = ownership_records.card_id
      and c.artist_id = public.current_user_artist_id()
  )
);

create policy "ownership_records_insert_admin"
on public.ownership_records
for insert
with check (public.current_user_is_admin());

create policy "ownership_records_update_admin"
on public.ownership_records
for update
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

