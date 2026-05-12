alter table public.artists
  add column if not exists application_contact_email text,
  add column if not exists application_medium text,
  add column if not exists application_origin_statement text,
  add column if not exists application_portfolio_url text,
  add column if not exists commercial_terms_acknowledged boolean not null default false,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by_profile_id uuid references public.profiles(id) on delete set null;

alter table public.artists disable trigger artists_enforce_status_boundary;

update public.artists
set
  application_contact_email = coalesce(application_contact_email, nullif(trim(p.email), '')),
  application_medium = coalesce(application_medium, 'Not captured before application packet fields were added.'),
  application_origin_statement = coalesce(application_origin_statement, bio),
  application_portfolio_url = coalesce(application_portfolio_url, website_url),
  commercial_terms_acknowledged = true
from public.profiles p
where artists.profile_id = p.id
  and artists.status in ('approved', 'pending_review')
  and artists.commercial_terms_acknowledged = false;

alter table public.artists enable trigger artists_enforce_status_boundary;
