-- AWO-6: initial RLS policy layer.
-- These policies protect app tables while leaving server-only workflows to
-- service-role code until narrower RPCs/API routes are built.

create or replace function public.current_profile_role()
returns public.profile_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = 'admin', false)
$$;

create or replace function public.current_user_artist_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.artists
  where profile_id = auth.uid()
$$;

create or replace function public.current_user_owns_cart(check_cart_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.carts
    where id = check_cart_id
      and owner_profile_id = auth.uid()
  )
$$;

create or replace function public.current_user_owns_order(check_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orders
    where id = check_order_id
      and buyer_profile_id = auth.uid()
  )
$$;

create or replace function public.card_is_public(check_card_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cards c
    join public.artists a on a.id = c.artist_id
    where c.id = check_card_id
      and c.status = 'published'
      and a.status = 'approved'
  )
$$;

create or replace function public.person_belongs_to_current_user(check_person_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.people
    where id = check_person_id
      and owner_profile_id = auth.uid()
  )
$$;

create or replace function public.occasion_belongs_to_current_user(check_occasion_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.occasions
    where id = check_occasion_id
      and owner_profile_id = auth.uid()
  )
$$;

-- Profiles
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (id = auth.uid() or public.current_user_is_admin());

create policy "profiles_insert_own"
on public.profiles
for insert
with check (id = auth.uid());

create policy "profiles_update_own_or_admin"
on public.profiles
for update
using (id = auth.uid() or public.current_user_is_admin())
with check (id = auth.uid() or public.current_user_is_admin());

-- Artists
create policy "artists_select_public_owner_or_admin"
on public.artists
for select
using (status = 'approved' or profile_id = auth.uid() or public.current_user_is_admin());

create policy "artists_insert_own"
on public.artists
for insert
with check (profile_id = auth.uid());

create policy "artists_update_own_or_admin"
on public.artists
for update
using (profile_id = auth.uid() or public.current_user_is_admin())
with check (profile_id = auth.uid() or public.current_user_is_admin());

create policy "artists_delete_admin"
on public.artists
for delete
using (public.current_user_is_admin());

-- Cards
create policy "cards_select_public_owner_or_admin"
on public.cards
for select
using (
  public.card_is_public(id)
  or artist_id = public.current_user_artist_id()
  or public.current_user_is_admin()
);

create policy "cards_insert_artist_owner_or_admin"
on public.cards
for insert
with check (
  artist_id = public.current_user_artist_id()
  or public.current_user_is_admin()
);

create policy "cards_update_artist_owner_or_admin"
on public.cards
for update
using (
  artist_id = public.current_user_artist_id()
  or public.current_user_is_admin()
)
with check (
  artist_id = public.current_user_artist_id()
  or public.current_user_is_admin()
);

create policy "cards_delete_admin"
on public.cards
for delete
using (public.current_user_is_admin());

-- Card media
create policy "card_media_select_public_owner_or_admin"
on public.card_media
for select
using (
  public.card_is_public(card_id)
  or exists (
    select 1
    from public.cards c
    where c.id = card_id
      and c.artist_id = public.current_user_artist_id()
  )
  or public.current_user_is_admin()
);

create policy "card_media_insert_artist_owner_or_admin"
on public.card_media
for insert
with check (
  exists (
    select 1
    from public.cards c
    where c.id = card_id
      and c.artist_id = public.current_user_artist_id()
  )
  or public.current_user_is_admin()
);

create policy "card_media_update_artist_owner_or_admin"
on public.card_media
for update
using (
  exists (
    select 1
    from public.cards c
    where c.id = card_id
      and c.artist_id = public.current_user_artist_id()
  )
  or public.current_user_is_admin()
)
with check (
  exists (
    select 1
    from public.cards c
    where c.id = card_id
      and c.artist_id = public.current_user_artist_id()
  )
  or public.current_user_is_admin()
);

create policy "card_media_delete_artist_owner_or_admin"
on public.card_media
for delete
using (
  exists (
    select 1
    from public.cards c
    where c.id = card_id
      and c.artist_id = public.current_user_artist_id()
  )
  or public.current_user_is_admin()
);

-- Buyer-owned people and occasions
create policy "people_all_owner_or_admin"
on public.people
for all
using (owner_profile_id = auth.uid() or public.current_user_is_admin())
with check (owner_profile_id = auth.uid() or public.current_user_is_admin());

create policy "occasions_all_owner_or_admin"
on public.occasions
for all
using (owner_profile_id = auth.uid() or public.current_user_is_admin())
with check (
  (owner_profile_id = auth.uid() or public.current_user_is_admin())
  and (
    person_id is null
    or public.current_user_is_admin()
    or public.person_belongs_to_current_user(person_id)
  )
);

-- Carts and cart items. Anonymous carts should use server-side service-role
-- workflows until a hardened anonymous cart token model is added.
create policy "carts_all_owner_or_admin"
on public.carts
for all
using (owner_profile_id = auth.uid() or public.current_user_is_admin())
with check (owner_profile_id = auth.uid() or public.current_user_is_admin());

create policy "cart_items_all_cart_owner_or_admin"
on public.cart_items
for all
using (public.current_user_owns_cart(cart_id) or public.current_user_is_admin())
with check (
  (public.current_user_owns_cart(cart_id) or public.current_user_is_admin())
  and (
    person_id is null
    or public.current_user_is_admin()
    or public.person_belongs_to_current_user(person_id)
  )
  and (
    occasion_id is null
    or public.current_user_is_admin()
    or public.occasion_belongs_to_current_user(occasion_id)
  )
);

-- Orders. Checkout creation and fulfillment can use server-side service-role
-- flows; authenticated buyers can read their own order history.
create policy "orders_select_owner_or_admin"
on public.orders
for select
using (buyer_profile_id = auth.uid() or public.current_user_is_admin());

create policy "orders_insert_owner_or_admin"
on public.orders
for insert
with check (buyer_profile_id = auth.uid() or public.current_user_is_admin());

create policy "orders_update_admin"
on public.orders
for update
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "order_items_select_buyer_artist_or_admin"
on public.order_items
for select
using (
  public.current_user_owns_order(order_id)
  or artist_id = public.current_user_artist_id()
  or public.current_user_is_admin()
);

create policy "order_items_insert_admin"
on public.order_items
for insert
with check (public.current_user_is_admin());

create policy "order_items_update_admin"
on public.order_items
for update
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

-- Reveal records stay server-mediated for V0.1. Recipients should use an API/RPC
-- that verifies reveal_public_id + PIN instead of reading this table directly.
create policy "honoree_reveals_select_admin"
on public.honoree_reveals
for select
using (public.current_user_is_admin());

create policy "honoree_reveals_all_admin"
on public.honoree_reveals
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

-- Audit events are admin-visible; inserts are allowed for admins and server-side
-- service-role workflows.
create policy "admin_audit_events_select_admin"
on public.admin_audit_events
for select
using (public.current_user_is_admin());

create policy "admin_audit_events_insert_admin"
on public.admin_audit_events
for insert
with check (public.current_user_is_admin());
