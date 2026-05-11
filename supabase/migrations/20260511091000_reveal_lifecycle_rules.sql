-- AWO-47: harden QR/PIN reveal lifecycle and lock rules.

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
  next_failed_attempts integer;
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

