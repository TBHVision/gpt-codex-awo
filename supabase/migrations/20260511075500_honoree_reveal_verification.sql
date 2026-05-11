-- AWO-41: server-mediated QR/PIN reveal verification.
-- Demo seed code: AWO-DEMO-001, demo PIN: 1234.

insert into public.orders (
  id,
  status,
  currency,
  subtotal_cents,
  tax_cents,
  total_cents,
  checkout_reference,
  recipient_name,
  occasion_label,
  source
)
values (
  '93000000-0000-0000-0000-000000000001',
  'paid',
  'USD',
  599,
  0,
  599,
  'AWO-DEMO-REVEAL',
  'Demo Recipient',
  'Birthday',
  'demo_reveal_seed'
)
on conflict (id) do update
set
  status = excluded.status,
  checkout_reference = excluded.checkout_reference,
  recipient_name = excluded.recipient_name,
  occasion_label = excluded.occasion_label,
  updated_at = now();

insert into public.order_items (
  id,
  order_id,
  card_id,
  artist_id,
  quantity,
  unit_price_cents,
  line_total_cents,
  reveal_public_id,
  reveal_pin_hash
)
values (
  '94000000-0000-0000-0000-000000000001',
  '93000000-0000-0000-0000-000000000001',
  '92000000-0000-0000-0000-000000000001',
  '91000000-0000-0000-0000-000000000001',
  1,
  599,
  599,
  'AWO-DEMO-001',
  extensions.crypt('1234', extensions.gen_salt('bf'))
)
on conflict (id) do update
set
  reveal_public_id = excluded.reveal_public_id,
  reveal_pin_hash = excluded.reveal_pin_hash;

insert into public.honoree_reveals (
  id,
  order_item_id,
  status
)
values (
  '95000000-0000-0000-0000-000000000001',
  '94000000-0000-0000-0000-000000000001',
  'not_started'
)
on conflict (order_item_id) do nothing;

create or replace function public.verify_honoree_reveal(
  card_code text,
  pin text
)
returns table (
  success boolean,
  message text,
  reveal_public_id text,
  reveal_status public.reveal_status,
  card_title text,
  card_description text,
  artist_name text,
  artist_bio text,
  checkout_reference text,
  recipient_name text,
  evidence_items jsonb,
  custody_steps jsonb,
  ownership_summary text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text := upper(nullif(trim(card_code), ''));
  normalized_pin text := nullif(trim(pin), '');
  reveal_record record;
begin
  if normalized_code is null or normalized_pin is null then
    return query
    select
      false,
      'Card code and PIN are required.',
      null::text,
      null::public.reveal_status,
      null::text,
      null::text,
      null::text,
      null::text,
      null::text,
      null::text,
      '[]'::jsonb,
      '[]'::jsonb,
      null::text;
    return;
  end if;

  select
    oi.id as order_item_id,
    oi.reveal_public_id,
    oi.reveal_pin_hash,
    hr.id as reveal_id,
    hr.status as reveal_status,
    c.title as card_title,
    c.description as card_description,
    a.public_name as artist_name,
    a.bio as artist_bio,
    o.checkout_reference,
    o.recipient_name,
    o.created_at as order_created_at
  into reveal_record
  from public.order_items oi
  join public.cards c on c.id = oi.card_id
  join public.artists a on a.id = oi.artist_id
  join public.orders o on o.id = oi.order_id
  left join public.honoree_reveals hr on hr.order_item_id = oi.id
  where upper(oi.reveal_public_id) = normalized_code
  limit 1;

  if reveal_record.order_item_id is null then
    return query
    select
      false,
      'No reveal record matches that card code.',
      null::text,
      null::public.reveal_status,
      null::text,
      null::text,
      null::text,
      null::text,
      null::text,
      null::text,
      '[]'::jsonb,
      '[]'::jsonb,
      null::text;
    return;
  end if;

  if reveal_record.reveal_pin_hash is null
    or extensions.crypt(normalized_pin, reveal_record.reveal_pin_hash) <> reveal_record.reveal_pin_hash
  then
    update public.honoree_reveals
    set
      failed_attempts = failed_attempts + 1,
      last_attempt_at = now()
    where id = reveal_record.reveal_id;

    return query
    select
      false,
      'That PIN does not match this card code.',
      reveal_record.reveal_public_id::text,
      reveal_record.reveal_status::public.reveal_status,
      null::text,
      null::text,
      null::text,
      null::text,
      null::text,
      null::text,
      '[]'::jsonb,
      '[]'::jsonb,
      null::text;
    return;
  end if;

  update public.honoree_reveals
  set
    status = case
      when status = 'not_started' then 'opened'::public.reveal_status
      else status
    end,
    first_opened_at = coalesce(first_opened_at, now()),
    last_attempt_at = now()
  where id = reveal_record.reveal_id;

  return query
  select
    true,
    'Reveal unlocked.',
    reveal_record.reveal_public_id::text,
    coalesce(reveal_record.reveal_status, 'opened'::public.reveal_status),
    reveal_record.card_title::text,
    reveal_record.card_description::text,
    reveal_record.artist_name::text,
    reveal_record.artist_bio::text,
    reveal_record.checkout_reference::text,
    reveal_record.recipient_name::text,
    jsonb_build_array(
      jsonb_build_object('label', 'Artist story', 'value', coalesce(reveal_record.artist_bio, 'Artist story captured by AWO.')),
      jsonb_build_object('label', 'Card record', 'value', reveal_record.card_title),
      jsonb_build_object('label', 'Reveal code', 'value', reveal_record.reveal_public_id)
    ),
    jsonb_build_array(
      jsonb_build_object('label', 'Created', 'value', 'Artist-origin record created.'),
      jsonb_build_object('label', 'Purchased', 'value', coalesce(reveal_record.checkout_reference, 'Order recorded.')),
      jsonb_build_object('label', 'Gifted', 'value', coalesce(reveal_record.recipient_name, 'Recipient unlock path prepared.')),
      jsonb_build_object('label', 'Revealed', 'value', 'PIN verified and reveal opened.')
    ),
    ('Verified reveal for ' || coalesce(reveal_record.recipient_name, 'recipient'))::text;
end;
$$;

revoke all on function public.verify_honoree_reveal(text, text) from public;
grant execute on function public.verify_honoree_reveal(text, text) to anon, authenticated;
