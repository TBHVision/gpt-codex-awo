-- AWO-71: connect ownership records to paid and fulfilled item lifecycles.

create or replace function public.admin_transition_fulfillment_item(
  p_order_item_id uuid,
  p_next_status public.order_item_status,
  p_actor_profile_id uuid,
  p_note text default null
)
returns table (
  order_item_id uuid,
  previous_status public.order_item_status,
  current_status public.order_item_status,
  order_fulfillment_status public.fulfillment_lifecycle_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  item_record record;
  actor_is_admin boolean;
  transition_allowed boolean := false;
  emitted_event public.custody_event_type;
  all_items_completed boolean := false;
  has_active_fulfillment_items boolean := false;
  next_order_fulfillment_status public.fulfillment_lifecycle_status;
  ownership_record_id uuid;
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
    oi.person_id,
    o.buyer_profile_id,
    o.checkout_reference,
    o.payment_status,
    o.fulfillment_status
  into item_record
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where oi.id = p_order_item_id
  for update of oi, o;

  if item_record.id is null then
    raise exception 'Order item was not found.';
  end if;

  if item_record.status = p_next_status then
    transition_allowed := true;
  elsif item_record.status = 'reserved' and p_next_status = 'purchased' then
    transition_allowed := item_record.payment_status = 'paid';
    emitted_event := 'order_paid';
  elsif item_record.status = 'purchased'
    and p_next_status in ('credential_pending', 'credential_active') then
    transition_allowed := item_record.payment_status = 'paid';
    emitted_event := case
      when p_next_status = 'credential_active' then 'credential_activated'::public.custody_event_type
      else null::public.custody_event_type
    end;
  elsif item_record.status = 'credential_pending'
    and p_next_status = 'credential_active' then
    transition_allowed := item_record.payment_status = 'paid';
    emitted_event := 'credential_activated';
  elsif item_record.status = 'credential_active'
    and p_next_status in ('revealed', 'completed') then
    transition_allowed := item_record.payment_status = 'paid';
    emitted_event := case
      when p_next_status = 'completed' then 'item_fulfilled'::public.custody_event_type
      else null::public.custody_event_type
    end;
  elsif item_record.status = 'revealed' and p_next_status = 'completed' then
    transition_allowed := item_record.payment_status = 'paid';
    emitted_event := 'item_fulfilled';
  elsif p_next_status = 'canceled' then
    transition_allowed := item_record.payment_status = 'canceled';
  elsif p_next_status = 'refunded' then
    transition_allowed := item_record.payment_status in ('refunded', 'partially_refunded');
  end if;

  if not transition_allowed then
    raise exception 'Fulfillment transition % -> % is not allowed for payment state %.',
      item_record.status,
      p_next_status,
      item_record.payment_status;
  end if;

  update public.order_items
  set status = p_next_status
  where id = item_record.id;

  select
    coalesce(bool_and(status = 'completed'), false),
    coalesce(
      bool_or(status in ('purchased', 'credential_pending', 'credential_active', 'revealed')),
      false
    )
  into all_items_completed, has_active_fulfillment_items
  from public.order_items
  where order_id = item_record.order_id;

  next_order_fulfillment_status := case
    when all_items_completed then 'fulfilled'::public.fulfillment_lifecycle_status
    when has_active_fulfillment_items then 'in_production'::public.fulfillment_lifecycle_status
    else item_record.fulfillment_status::public.fulfillment_lifecycle_status
  end;

  update public.orders
  set
    fulfillment_status = next_order_fulfillment_status,
    status = case
      when all_items_completed then 'fulfilled'::public.order_status
      else status
    end,
    updated_at = now()
  where id = item_record.order_id;

  if p_next_status = 'completed' and item_record.status <> p_next_status then
    insert into public.ownership_records (
      order_item_id,
      card_id,
      buyer_profile_id,
      recipient_person_id,
      status,
      ownership_summary,
      activated_at,
      metadata
    )
    values (
      item_record.id,
      item_record.card_id,
      item_record.buyer_profile_id,
      item_record.person_id,
      'active',
      'Ownership recorded after AWO fulfillment completion.',
      now(),
      jsonb_build_object(
        'checkout_reference', item_record.checkout_reference,
        'source', 'admin_transition_fulfillment_item'
      )
    )
    on conflict (order_item_id)
    do update set
      status = 'active',
      buyer_profile_id = coalesce(ownership_records.buyer_profile_id, excluded.buyer_profile_id),
      recipient_person_id = coalesce(ownership_records.recipient_person_id, excluded.recipient_person_id),
      ownership_summary = excluded.ownership_summary,
      activated_at = coalesce(ownership_records.activated_at, now()),
      revoked_at = null,
      updated_at = now(),
      metadata = ownership_records.metadata || excluded.metadata
    returning id into ownership_record_id;

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
      'ownership_recorded',
      jsonb_build_object(
        'ownership_record_id', ownership_record_id,
        'checkout_reference', item_record.checkout_reference,
        'source', 'admin_transition_fulfillment_item'
      )
    );
  end if;

  if emitted_event is not null and item_record.status <> p_next_status then
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
      emitted_event,
      jsonb_build_object(
        'previous_status', item_record.status,
        'next_status', p_next_status,
        'note', nullif(trim(coalesce(p_note, '')), ''),
        'source', 'admin_transition_fulfillment_item'
      )
    );
  end if;

  if item_record.status <> p_next_status then
    insert into public.admin_audit_events (
      actor_profile_id,
      action,
      entity_table,
      entity_id,
      metadata
    )
    values (
      p_actor_profile_id,
      'fulfillment_item_transitioned',
      'order_items',
      item_record.id,
      jsonb_build_object(
        'previous_status', item_record.status,
        'next_status', p_next_status,
        'order_id', item_record.order_id,
        'note', nullif(trim(coalesce(p_note, '')), '')
      )
    );
  end if;

  return query
  select
    item_record.id::uuid,
    item_record.status::public.order_item_status,
    p_next_status::public.order_item_status,
    next_order_fulfillment_status::public.fulfillment_lifecycle_status;
end;
$$;

revoke all on function public.admin_transition_fulfillment_item(
  uuid,
  public.order_item_status,
  uuid,
  text
) from public;
grant execute on function public.admin_transition_fulfillment_item(
  uuid,
  public.order_item_status,
  uuid,
  text
) to authenticated;
grant execute on function public.admin_transition_fulfillment_item(
  uuid,
  public.order_item_status,
  uuid,
  text
) to service_role;
