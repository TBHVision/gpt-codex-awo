-- AWO-37: narrow server-mediated anonymous order draft creation.
-- This keeps direct table writes protected by RLS while allowing checkout
-- drafts through a validated RPC.

alter table public.orders
  add column if not exists recipient_name text,
  add column if not exists occasion_label text,
  add column if not exists message_notes text,
  add column if not exists source text not null default 'web_checkout_draft';

create or replace function public.create_anonymous_order_draft(
  recipient_name text,
  occasion_label text,
  message_notes text,
  items jsonb
)
returns table (
  order_id uuid,
  checkout_reference text,
  item_count integer,
  subtotal_cents integer,
  total_cents integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  draft_order_id uuid;
  draft_reference text;
  normalized_recipient text := nullif(trim(recipient_name), '');
  normalized_occasion text := nullif(trim(occasion_label), '');
  normalized_notes text := nullif(trim(message_notes), '');
  line record;
  card_record record;
  safe_quantity integer;
  running_item_count integer := 0;
  running_subtotal_cents integer := 0;
begin
  if normalized_recipient is null then
    raise exception 'recipient_name is required' using errcode = '22023';
  end if;

  if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items) = 0 then
    raise exception 'at least one checkout item is required' using errcode = '22023';
  end if;

  if jsonb_array_length(items) > 20 then
    raise exception 'too many checkout items' using errcode = '22023';
  end if;

  draft_reference := 'AWO-DRAFT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  insert into public.orders (
    status,
    currency,
    subtotal_cents,
    tax_cents,
    total_cents,
    checkout_reference,
    recipient_name,
    occasion_label,
    message_notes,
    source
  )
  values (
    'draft',
    'USD',
    0,
    0,
    0,
    draft_reference,
    left(normalized_recipient, 160),
    left(coalesce(normalized_occasion, ''), 160),
    left(coalesce(normalized_notes, ''), 2000),
    'web_checkout_draft'
  )
  returning id into draft_order_id;

  for line in
    select
      nullif(trim(value ->> 'slug'), '') as slug,
      greatest(1, least(coalesce((value ->> 'quantity')::integer, 1), 25)) as quantity
    from jsonb_array_elements(items)
  loop
    if line.slug is null then
      raise exception 'checkout item slug is required' using errcode = '22023';
    end if;

    select
      cards.id,
      cards.artist_id,
      cards.price_cents
    into card_record
    from public.cards
    where cards.slug = line.slug
      and cards.status = 'published'
    limit 1;

    if card_record.id is null then
      raise exception 'checkout item is not published: %', line.slug using errcode = '22023';
    end if;

    safe_quantity := line.quantity;
    running_item_count := running_item_count + safe_quantity;
    running_subtotal_cents := running_subtotal_cents + (card_record.price_cents * safe_quantity);

    insert into public.order_items (
      order_id,
      card_id,
      artist_id,
      quantity,
      unit_price_cents,
      line_total_cents
    )
    values (
      draft_order_id,
      card_record.id,
      card_record.artist_id,
      safe_quantity,
      card_record.price_cents,
      card_record.price_cents * safe_quantity
    );
  end loop;

  update public.orders
  set
    subtotal_cents = running_subtotal_cents,
    total_cents = running_subtotal_cents
  where id = draft_order_id;

  return query
  select
    draft_order_id,
    draft_reference,
    running_item_count,
    running_subtotal_cents,
    running_subtotal_cents;
end;
$$;

revoke all on function public.create_anonymous_order_draft(text, text, text, jsonb) from public;
grant execute on function public.create_anonymous_order_draft(text, text, text, jsonb) to anon, authenticated;
