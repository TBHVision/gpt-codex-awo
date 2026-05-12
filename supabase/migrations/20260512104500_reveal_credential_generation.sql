-- AWO-77: production QR/PIN credential generation foundation.
-- Generates a one-time reveal code/PIN packet for paid order items without
-- storing the raw PIN. The raw PIN is returned only to the trusted caller.

create or replace function public.generate_order_item_reveal_credential(
  p_order_item_id uuid,
  p_actor_profile_id uuid,
  p_note text default null
)
returns table (
  order_item_id uuid,
  reveal_public_id text,
  reveal_pin text,
  credential_status public.reveal_credential_status,
  item_status public.order_item_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  item_record record;
  actor_is_admin boolean;
  generated_code text;
  generated_pin text;
  code_exists boolean := true;
  attempt_count integer := 0;
begin
  if p_actor_profile_id is null then
    raise exception 'Named admin actor is required.';
  end if;

  select exists (
    select 1
    from public.profiles
    where id = p_actor_profile_id
      and role = 'admin'
  )
  into actor_is_admin;

  if not actor_is_admin then
    raise exception 'Actor is not an admin.';
  end if;

  select
    oi.id,
    oi.status,
    oi.order_id,
    oi.card_id,
    oi.reveal_pin_hash,
    o.payment_status
  into item_record
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where oi.id = p_order_item_id
  for update of oi, o;

  if item_record.id is null then
    raise exception 'Order item was not found.';
  end if;

  if item_record.payment_status <> 'paid' then
    raise exception 'Reveal credentials can only be generated for paid items.';
  end if;

  if item_record.status not in (
    'purchased'::public.order_item_status,
    'credential_pending'::public.order_item_status,
    'credential_active'::public.order_item_status
  ) then
    raise exception 'Reveal credentials cannot be generated for item status %.',
      item_record.status;
  end if;

  if item_record.status = 'credential_active'
    and item_record.reveal_pin_hash is not null then
    raise exception 'Reveal credential is already active. Use a rotate/revoke workflow instead.';
  end if;

  while code_exists loop
    attempt_count := attempt_count + 1;
    generated_code := 'AWO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

    select exists (
      select 1
      from public.order_items
      where upper(reveal_public_id) = generated_code
        and id <> item_record.id
    )
    into code_exists;

    if attempt_count > 10 then
      raise exception 'Could not generate a unique reveal code.';
    end if;
  end loop;

  generated_pin := lpad(floor(random() * 1000000)::integer::text, 6, '0');

  update public.order_items
  set
    reveal_public_id = generated_code,
    reveal_pin_hash = extensions.crypt(generated_pin, extensions.gen_salt('bf')),
    status = 'credential_active'
  where id = item_record.id;

  insert into public.honoree_reveals (
    order_item_id,
    status,
    credential_status,
    failed_attempts,
    last_attempt_at,
    expires_at,
    revoked_at,
    revocation_reason,
    updated_at
  )
  values (
    item_record.id,
    'not_started',
    'active',
    0,
    null,
    null,
    null,
    null,
    now()
  )
  on conflict (order_item_id)
  do update set
    status = case
      when honoree_reveals.status = 'completed' then honoree_reveals.status
      else 'not_started'::public.reveal_status
    end,
    credential_status = 'active',
    failed_attempts = 0,
    last_attempt_at = null,
    expires_at = null,
    revoked_at = null,
    revocation_reason = null,
    updated_at = now();

  insert into public.custody_events (
    order_item_id,
    card_id,
    actor_profile_id,
    event_type,
    event_payload
  )
  values (
    item_record.id,
    item_record.card_id,
    p_actor_profile_id,
    'credential_activated',
    jsonb_build_object(
      'previous_status', item_record.status,
      'next_status', 'credential_active',
      'reveal_public_id', generated_code,
      'note', nullif(trim(coalesce(p_note, '')), ''),
      'source', 'generate_order_item_reveal_credential'
    )
  );

  insert into public.admin_audit_events (
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    metadata
  )
  values (
    p_actor_profile_id,
    'reveal_credential_generated',
    'order_items',
    item_record.id,
    jsonb_build_object(
      'previous_status', item_record.status,
      'next_status', 'credential_active',
      'order_id', item_record.order_id,
      'reveal_public_id', generated_code,
      'note', nullif(trim(coalesce(p_note, '')), '')
    )
  );

  return query
  select
    item_record.id::uuid,
    generated_code::text,
    generated_pin::text,
    'active'::public.reveal_credential_status,
    'credential_active'::public.order_item_status;
end;
$$;

revoke all on function public.generate_order_item_reveal_credential(
  uuid,
  uuid,
  text
) from public;
grant execute on function public.generate_order_item_reveal_credential(
  uuid,
  uuid,
  text
) to authenticated;
grant execute on function public.generate_order_item_reveal_credential(
  uuid,
  uuid,
  text
) to service_role;
