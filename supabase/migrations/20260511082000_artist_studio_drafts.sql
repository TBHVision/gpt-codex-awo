-- AWO-42: persist studio draft provenance checklist state on cards.

alter table public.cards
  add column if not exists provenance_checklist text[] not null default '{}',
  add column if not exists studio_notes text;
