-- AWO-81: custody event names for audited lifecycle exception handling.
-- These values are added separately so later migrations can safely use them.

alter type public.custody_event_type add value if not exists 'item_refunded';
alter type public.custody_event_type add value if not exists 'ownership_transferred';
alter type public.custody_event_type add value if not exists 'ownership_revoked';
