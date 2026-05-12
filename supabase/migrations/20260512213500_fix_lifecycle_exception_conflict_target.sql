-- AWO-81: fix lifecycle exception ownership upsert ambiguity.
-- Use the named unique constraint for the ownership upsert because the RPC
-- returns a column named order_item_id.

create or replace function public.admin_transition_lifecycle_exception(
  p_order_item_id uuid,
  p_action text,
  p_actor_profile_id uuid,
  p_note text default null,
  p_transfer_to_profile_id uuid default null,
  p_transfer_to_person_id uuid default null
)
returns table (
  order_item_id uuid,
  action text,
  item_status public.order_item_status,
  credential_status public.reveal_credential_status,
  ownership_status public.ownership_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  item_record record;
  ownership_record record;
  actor_is_admin boolean;
  normalized_action text;
  note_value text;
  all_items_refunded boolean := false;
  any_items_refunded boolean := false;
  next_payment_status public.payment_lifecycle_status;
  next_order_status public.order_status;
  next_credential_status public.reveal_credential_status;
  next_ownership_status public.ownership_status;
begin
  normalized_action := lower(trim(coalesce(p_action, '')));
  note_value := nullif(trim(coalesce(p_note, '')), '');

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

  if normalized_action not in (
    'refund_item',
    'revoke_credential',
    'revoke_ownership',
    'transfer_ownership'
  ) then
    raise exception 'Unsupported lifecycle exception action %.', p_action;
  end if;

  select
    oi.id,
    oi.status,
    oi.order_id,
    oi.card_id,
    oi.person_id,
    o.buyer_profile_id,
    o.checkout_reference,
    o.payment_status,
    o.status as order_status
  into item_record
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where oi.id = p_order_item_id
  for update of oi, o;

  if item_record.id is null then
    raise exception 'Order item was not found.';
  end if;

  select *
  into ownership_record
  from public.ownership_records owner_record
  where owner_record.order_item_id = item_record.id
  for update;

  if normalized_action = 'revoke_credential' then
    update public.honoree_reveals hr
    set
      credential_status = 'revoked',
      status = case
        when status = 'completed' then status
        else 'locked'::public.reveal_status
      end,
      revoked_at = coalesce(revoked_at, now()),
      revocation_reason = coalesce(note_value, 'Revoked by named admin.'),
      updated_at = now()
    where hr.order_item_id = item_record.id
    returning hr.credential_status into next_credential_status;

    if next_credential_status is null then
      raise exception 'Reveal credential was not found for this item.';
    end if;

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
      'credential_revoked',
      jsonb_build_object(
        'action', normalized_action,
        'note', note_value,
        'source', 'admin_transition_lifecycle_exception'
      )
    );

    next_ownership_status := ownership_record.status;
  elsif normalized_action = 'refund_item' then
    if item_record.payment_status not in ('paid', 'partially_refunded') then
      raise exception 'Refund exception requires a paid or partially refunded order.';
    end if;

    update public.order_items
    set status = 'refunded'
    where id = item_record.id;

    update public.honoree_reveals hr
    set
      credential_status = 'revoked',
      status = case
        when status = 'completed' then status
        else 'locked'::public.reveal_status
      end,
      revoked_at = coalesce(revoked_at, now()),
      revocation_reason = coalesce(note_value, 'Item refund recorded by named admin.'),
      updated_at = now()
    where hr.order_item_id = item_record.id
    returning hr.credential_status into next_credential_status;

    insert into public.ownership_records (
      order_item_id,
      card_id,
      buyer_profile_id,
      recipient_person_id,
      status,
      ownership_summary,
      revoked_at,
      metadata
    )
    values (
      item_record.id,
      item_record.card_id,
      item_record.buyer_profile_id,
      item_record.person_id,
      'refunded',
      'Ownership no longer active because an item refund exception was recorded.',
      now(),
      jsonb_build_object(
        'checkout_reference', item_record.checkout_reference,
        'source', 'admin_transition_lifecycle_exception',
        'note', note_value
      )
    )
    on conflict on constraint ownership_records_order_item_id_key
    do update set
      status = 'refunded',
      ownership_summary = excluded.ownership_summary,
      revoked_at = coalesce(ownership_records.revoked_at, now()),
      updated_at = now(),
      metadata = ownership_records.metadata || excluded.metadata
    returning status into next_ownership_status;

    select
      coalesce(bool_and(status = 'refunded'), false),
      coalesce(bool_or(status = 'refunded'), false)
    into all_items_refunded, any_items_refunded
    from public.order_items
    where order_id = item_record.order_id;

    next_payment_status := case
      when all_items_refunded then 'refunded'::public.payment_lifecycle_status
      when any_items_refunded then 'partially_refunded'::public.payment_lifecycle_status
      else item_record.payment_status::public.payment_lifecycle_status
    end;

    next_order_status := case
      when all_items_refunded then 'refunded'::public.order_status
      else item_record.order_status::public.order_status
    end;

    update public.orders
    set
      payment_status = next_payment_status,
      status = next_order_status,
      refunded_at = coalesce(refunded_at, now()),
      updated_at = now()
    where id = item_record.order_id;

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
      'item_refunded',
      jsonb_build_object(
        'action', normalized_action,
        'payment_status', next_payment_status,
        'note', note_value,
        'source', 'admin_transition_lifecycle_exception'
      )
    );

    if next_credential_status = 'revoked' then
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
        'credential_revoked',
        jsonb_build_object(
          'action', normalized_action,
          'note', note_value,
          'source', 'admin_transition_lifecycle_exception'
        )
      );
    end if;
  elsif normalized_action = 'revoke_ownership' then
    if ownership_record.id is null then
      raise exception 'Ownership record was not found for this item.';
    end if;

    update public.ownership_records
    set
      status = 'revoked',
      ownership_summary = 'Ownership claim was revoked by named admin review.',
      revoked_at = coalesce(revoked_at, now()),
      updated_at = now(),
      metadata = metadata || jsonb_build_object(
        'last_exception_action', normalized_action,
        'note', note_value,
        'source', 'admin_transition_lifecycle_exception'
      )
    where id = ownership_record.id
    returning status into next_ownership_status;

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
      'ownership_revoked',
      jsonb_build_object(
        'ownership_record_id', ownership_record.id,
        'action', normalized_action,
        'note', note_value,
        'source', 'admin_transition_lifecycle_exception'
      )
    );
  elsif normalized_action = 'transfer_ownership' then
    if ownership_record.id is null then
      raise exception 'Ownership record was not found for this item.';
    end if;

    if p_transfer_to_profile_id is null and p_transfer_to_person_id is null then
      raise exception 'Ownership transfer requires a target profile or person.';
    end if;

    update public.ownership_records
    set
      buyer_profile_id = coalesce(p_transfer_to_profile_id, buyer_profile_id),
      recipient_person_id = coalesce(p_transfer_to_person_id, recipient_person_id),
      status = 'transferred',
      ownership_summary = 'Ownership was transferred by named admin review.',
      transferred_at = now(),
      revoked_at = null,
      updated_at = now(),
      metadata = metadata || jsonb_build_object(
        'last_exception_action', normalized_action,
        'transfer_to_profile_id', p_transfer_to_profile_id,
        'transfer_to_person_id', p_transfer_to_person_id,
        'note', note_value,
        'source', 'admin_transition_lifecycle_exception'
      )
    where id = ownership_record.id
    returning status into next_ownership_status;

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
      'ownership_transferred',
      jsonb_build_object(
        'ownership_record_id', ownership_record.id,
        'action', normalized_action,
        'transfer_to_profile_id', p_transfer_to_profile_id,
        'transfer_to_person_id', p_transfer_to_person_id,
        'note', note_value,
        'source', 'admin_transition_lifecycle_exception'
      )
    );
  end if;

  if normalized_action <> 'revoke_credential' then
    select hr.credential_status
    into next_credential_status
    from public.honoree_reveals hr
    where hr.order_item_id = item_record.id;
  end if;

  if next_ownership_status is null then
    next_ownership_status := ownership_record.status;
  end if;

  insert into public.admin_audit_events (
    actor_profile_id,
    action,
    entity_table,
    entity_id,
    metadata
  )
  values (
    p_actor_profile_id,
    normalized_action,
    'order_items',
    item_record.id,
    jsonb_build_object(
      'order_id', item_record.order_id,
      'checkout_reference', item_record.checkout_reference,
      'note', note_value,
      'transfer_to_profile_id', p_transfer_to_profile_id,
      'transfer_to_person_id', p_transfer_to_person_id,
      'source', 'admin_transition_lifecycle_exception'
    )
  );

  return query
  select
    item_record.id::uuid,
    normalized_action::text,
    coalesce(
      (select status from public.order_items where id = item_record.id),
      item_record.status
    )::public.order_item_status,
    next_credential_status::public.reveal_credential_status,
    next_ownership_status::public.ownership_status;
end;
$$;

revoke all on function public.admin_transition_lifecycle_exception(
  uuid,
  text,
  uuid,
  text,
  uuid,
  uuid
) from public;
grant execute on function public.admin_transition_lifecycle_exception(
  uuid,
  text,
  uuid,
  text,
  uuid,
  uuid
) to authenticated;
grant execute on function public.admin_transition_lifecycle_exception(
  uuid,
  text,
  uuid,
  text,
  uuid,
  uuid
) to service_role;
