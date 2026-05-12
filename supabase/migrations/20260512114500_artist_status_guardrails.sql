create or replace function public.enforce_artist_status_boundary()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_privileged boolean;
begin
  is_privileged := coalesce(auth.role() = 'service_role', false) or public.current_user_is_admin();

  if is_privileged then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'Authentication is required to manage artist profiles.'
      using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    if new.profile_id is distinct from auth.uid() then
      raise exception 'Artists can only create their own artist profile.'
        using errcode = '42501';
    end if;

    if new.status not in ('draft'::public.artist_status, 'pending_review'::public.artist_status) then
      raise exception 'Artist self-service submissions must start as draft or pending review.'
        using errcode = '42501';
    end if;

    return new;
  end if;

  if old.profile_id is distinct from auth.uid()
    or new.profile_id is distinct from old.profile_id then
    raise exception 'Artists can only update their own artist profile.'
      using errcode = '42501';
  end if;

  if new.status is distinct from old.status then
    if old.status in ('approved'::public.artist_status, 'rejected'::public.artist_status, 'suspended'::public.artist_status)
      or new.status not in ('draft'::public.artist_status, 'pending_review'::public.artist_status) then
      raise exception 'Artist approval status changes require an admin review action.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists artists_enforce_status_boundary on public.artists;
create trigger artists_enforce_status_boundary
before insert or update on public.artists
for each row execute function public.enforce_artist_status_boundary();
