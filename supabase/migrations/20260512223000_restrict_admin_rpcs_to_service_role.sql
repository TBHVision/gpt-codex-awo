revoke execute on function public.admin_transition_fulfillment_item(
  uuid,
  public.order_item_status,
  uuid,
  text
) from authenticated;

revoke execute on function public.generate_order_item_reveal_credential(
  uuid,
  uuid,
  text
) from authenticated;

revoke execute on function public.admin_transition_lifecycle_exception(
  uuid,
  text,
  uuid,
  text,
  uuid,
  uuid
) from authenticated;

grant execute on function public.admin_transition_fulfillment_item(
  uuid,
  public.order_item_status,
  uuid,
  text
) to service_role;

grant execute on function public.generate_order_item_reveal_credential(
  uuid,
  uuid,
  text
) to service_role;

grant execute on function public.admin_transition_lifecycle_exception(
  uuid,
  text,
  uuid,
  text,
  uuid,
  uuid
) to service_role;
