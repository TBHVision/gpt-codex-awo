-- AWO-76: carry sender message and occasion into recipient playback.
-- Drop/recreate is required because PostgreSQL cannot change a function's
-- returned table shape with create-or-replace alone.

update public.artists
set
  bio = 'HatchVision Studio is the seeded AWO demo artist profile. This profile stands in for a real artist origin record: human-made artwork, artist-approved story notes, and a published card that can be traced through purchase, gifting, reveal, and ownership.',
  updated_at = now()
where id = '91000000-0000-0000-0000-000000000001';

update public.cards
set
  description = 'A hand-painted wildflower card prepared for the AWO demo flow, with artist story, paid checkout, private reveal, custody events, and ownership record evidence connected end to end.',
  updated_at = now()
where id = '92000000-0000-0000-0000-000000000001';

update public.orders
set
  occasion_label = 'Birthday',
  message_notes = 'I picked this card because it felt calm, handmade, and personal. I hope the artist story behind it makes the moment feel even more yours.',
  payment_status = 'paid',
  fulfillment_status = case
    when fulfillment_status = 'not_started' then 'in_production'::public.fulfillment_lifecycle_status
    else fulfillment_status
  end,
  payment_provider = coalesce(payment_provider, 'stripe_test'),
  paid_at = coalesce(paid_at, now()),
  updated_at = now()
where id = '93000000-0000-0000-0000-000000000001';

update public.order_items
set status = case
  when status in ('reserved', 'purchased', 'credential_pending') then 'credential_active'::public.order_item_status
  else status
end
where id = '94000000-0000-0000-0000-000000000001';

insert into public.ownership_records (
  order_item_id,
  card_id,
  status,
  ownership_summary,
  metadata
)
values (
  '94000000-0000-0000-0000-000000000001',
  '92000000-0000-0000-0000-000000000001',
  'pending',
  'Pending ownership record created for the seeded AWO demo. Activation waits for fulfillment completion, so the reveal can show honest proof without overstating final ownership.',
  jsonb_build_object(
    'checkout_reference', 'AWO-DEMO-REVEAL',
    'source', 'demo_reveal_story_polish'
  )
)
on conflict (order_item_id)
do update set
  status = case
    when ownership_records.status = 'active' then ownership_records.status
    else excluded.status
  end,
  ownership_summary = case
    when ownership_records.status = 'active' then ownership_records.ownership_summary
    else excluded.ownership_summary
  end,
  metadata = ownership_records.metadata || excluded.metadata,
  updated_at = now();

insert into public.custody_events (
  order_item_id,
  card_id,
  event_type,
  event_payload
)
select
  '94000000-0000-0000-0000-000000000001',
  '92000000-0000-0000-0000-000000000001',
  seed.event_type::public.custody_event_type,
  seed.event_payload
from (
  values
    (
      'order_paid',
      jsonb_build_object(
        'checkout_reference', 'AWO-DEMO-REVEAL',
        'payment_provider', 'stripe_test',
        'source', 'demo_reveal_story_polish'
      )
    ),
    (
      'credential_activated',
      jsonb_build_object(
        'reveal_public_id', 'AWO-DEMO-001',
        'source', 'demo_reveal_story_polish'
      )
    )
) as seed(event_type, event_payload)
where not exists (
  select 1
  from public.custody_events ce
  where ce.order_item_id = '94000000-0000-0000-0000-000000000001'
    and ce.event_type = seed.event_type::public.custody_event_type
);

drop function if exists public.verify_honoree_reveal(text, text);

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
  occasion_label text,
  sender_message text,
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
  next_failed_attempts integer;
  ownership_posture text;
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
    oi.status as order_item_status,
    hr.id as reveal_id,
    hr.status as reveal_status,
    hr.credential_status,
    hr.expires_at,
    hr.failed_attempts,
    hr.max_failed_attempts,
    c.id as card_id,
    c.title as card_title,
    c.description as card_description,
    a.public_name as artist_name,
    a.bio as artist_bio,
    o.checkout_reference,
    o.recipient_name,
    o.occasion_label,
    o.message_notes,
    o.created_at as order_created_at,
    o.payment_status,
    o.fulfillment_status,
    own.status as ownership_status,
    own.ownership_summary as stored_ownership_summary,
    own.activated_at as ownership_activated_at
  into reveal_record
  from public.order_items oi
  join public.cards c on c.id = oi.card_id
  join public.artists a on a.id = oi.artist_id
  join public.orders o on o.id = oi.order_id
  left join public.honoree_reveals hr on hr.order_item_id = oi.id
  left join public.ownership_records own on own.order_item_id = oi.id
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
      null::text,
      null::text,
      '[]'::jsonb,
      '[]'::jsonb,
      null::text;
    return;
  end if;

  if reveal_record.reveal_id is null then
    return query
    select
      false,
      'This reveal credential is not active yet.',
      reveal_record.reveal_public_id::text,
      null::public.reveal_status,
      null::text,
      null::text,
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

  if reveal_record.expires_at is not null and reveal_record.expires_at <= now() then
    update public.honoree_reveals
    set
      credential_status = 'expired',
      last_attempt_at = now()
    where id = reveal_record.reveal_id;

    return query
    select
      false,
      'This reveal credential has expired.',
      reveal_record.reveal_public_id::text,
      reveal_record.reveal_status::public.reveal_status,
      null::text,
      null::text,
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

  if reveal_record.credential_status in (
    'pending_generation',
    'locked',
    'expired',
    'revoked',
    'generation_failed'
  ) then
    return query
    select
      false,
      case reveal_record.credential_status
        when 'pending_generation' then 'This reveal credential is not active yet.'
        when 'locked' then 'This reveal credential is locked. Contact support for help.'
        when 'expired' then 'This reveal credential has expired.'
        when 'revoked' then 'This reveal credential is no longer valid.'
        when 'generation_failed' then 'This reveal credential needs support review.'
        else 'This reveal credential cannot be opened right now.'
      end,
      reveal_record.reveal_public_id::text,
      reveal_record.reveal_status::public.reveal_status,
      null::text,
      null::text,
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
    next_failed_attempts := reveal_record.failed_attempts + 1;

    update public.honoree_reveals
    set
      failed_attempts = failed_attempts + 1,
      last_attempt_at = now(),
      credential_status = case
        when failed_attempts + 1 >= max_failed_attempts then 'locked'::public.reveal_credential_status
        else credential_status
      end,
      status = case
        when failed_attempts + 1 >= max_failed_attempts then 'locked'::public.reveal_status
        else status
      end
    where id = reveal_record.reveal_id;

    return query
    select
      false,
      case
        when next_failed_attempts >= reveal_record.max_failed_attempts
          then 'Too many invalid attempts. This reveal credential is now locked.'
        else 'That PIN does not match this card code.'
      end,
      reveal_record.reveal_public_id::text,
      case
        when next_failed_attempts >= reveal_record.max_failed_attempts
          then 'locked'::public.reveal_status
        else reveal_record.reveal_status::public.reveal_status
      end,
      null::text,
      null::text,
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
    credential_status = case
      when credential_status = 'active' then 'opened'::public.reveal_credential_status
      else credential_status
    end,
    first_opened_at = coalesce(first_opened_at, now()),
    last_attempt_at = now()
  where id = reveal_record.reveal_id;

  insert into public.custody_events (
    order_item_id,
    card_id,
    event_type,
    event_payload
  )
  values (
    reveal_record.order_item_id,
    reveal_record.card_id,
    'recipient_revealed',
    jsonb_build_object(
      'reveal_public_id', reveal_record.reveal_public_id,
      'checkout_reference', reveal_record.checkout_reference,
      'source', 'verify_honoree_reveal'
    )
  );

  ownership_posture := case reveal_record.ownership_status
    when 'active' then 'Active ownership record'
    when 'pending' then 'Pending ownership record'
    when 'transferred' then 'Transferred ownership record'
    when 'revoked' then 'Revoked ownership record'
    when 'refunded' then 'Refunded ownership record'
    when 'voided' then 'Voided ownership record'
    else 'Ownership record pending'
  end;

  return query
  select
    true,
    'Reveal unlocked.',
    reveal_record.reveal_public_id::text,
    case
      when reveal_record.reveal_status = 'completed' then 'completed'::public.reveal_status
      else 'opened'::public.reveal_status
    end,
    reveal_record.card_title::text,
    reveal_record.card_description::text,
    reveal_record.artist_name::text,
    reveal_record.artist_bio::text,
    reveal_record.checkout_reference::text,
    reveal_record.recipient_name::text,
    reveal_record.occasion_label::text,
    reveal_record.message_notes::text,
    jsonb_build_array(
      jsonb_build_object(
        'label', 'Human creation record',
        'value', coalesce(reveal_record.artist_name, 'The artist') || ' is attached to this published AWO card as the human origin source.'
      ),
      jsonb_build_object(
        'label', 'Artist story',
        'value', coalesce(reveal_record.artist_bio, 'Artist story captured by AWO.')
      ),
      jsonb_build_object(
        'label', 'Sender message',
        'value', coalesce(nullif(trim(reveal_record.message_notes), ''), 'The sender did not include a message yet.')
      ),
      jsonb_build_object(
        'label', 'Paid checkout record',
        'value', 'Checkout ' || coalesce(reveal_record.checkout_reference, 'recorded by AWO') || ' is marked ' || reveal_record.payment_status::text || '.'
      ),
      jsonb_build_object(
        'label', 'Private reveal credential',
        'value', 'Reveal code ' || reveal_record.reveal_public_id || ' verified successfully with the recipient PIN.'
      ),
      jsonb_build_object(
        'label', 'Ownership posture',
        'value', ownership_posture || '. ' || coalesce(reveal_record.stored_ownership_summary, 'Final ownership activation waits for fulfillment completion.')
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'label', 'Created',
        'value', coalesce(reveal_record.artist_name, 'Artist') || ' published ' || coalesce(reveal_record.card_title, 'this card') || ' with AWO provenance metadata.'
      ),
      jsonb_build_object(
        'label', 'Purchased',
        'value', 'Stripe test checkout ' || coalesce(reveal_record.checkout_reference, 'recorded by AWO') || ' is marked ' || reveal_record.payment_status::text || '.'
      ),
      jsonb_build_object(
        'label', 'Prepared',
        'value', 'The order item is ' || reveal_record.order_item_status::text || ' and the private reveal credential is ' || reveal_record.credential_status::text || '.'
      ),
      jsonb_build_object(
        'label', 'Gifted',
        'value', 'Recipient path prepared for ' || coalesce(reveal_record.recipient_name, 'the recipient') || coalesce(' for ' || nullif(trim(reveal_record.occasion_label), ''), '') || '.'
      ),
      jsonb_build_object(
        'label', 'Revealed',
        'value', 'PIN verified through AWO and a recipient_revealed custody event was recorded.'
      )
    ),
    (
      coalesce(reveal_record.recipient_name, 'Recipient') || ' opened ' ||
      coalesce(reveal_record.card_title, 'this AWO card') || coalesce(' for ' || nullif(trim(reveal_record.occasion_label), ''), '') || '. ' ||
      ownership_posture || ' is tied to checkout ' ||
      coalesce(reveal_record.checkout_reference, 'recorded by AWO') ||
      '; final active ownership is only claimed after fulfillment is complete.'
    )::text;
end;
$$;

revoke all on function public.verify_honoree_reveal(text, text) from public;
grant execute on function public.verify_honoree_reveal(text, text) to anon, authenticated;
