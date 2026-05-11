-- AWO-38: create a buyer profile automatically when a Supabase Auth user signs up.
-- User-facing signup must never choose privileged roles.

create or replace function public.create_buyer_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, display_name, email)
  values (
    new.id,
    'buyer',
    nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), ''),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.profiles.display_name, excluded.display_name);

  return new;
end;
$$;

drop trigger if exists create_buyer_profile_after_auth_signup on auth.users;

create trigger create_buyer_profile_after_auth_signup
after insert on auth.users
for each row execute function public.create_buyer_profile_for_auth_user();
