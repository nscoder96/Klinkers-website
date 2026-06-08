-- F2 / Deel B2 + Deel C: prijsversionering op pricing
-- Additief + idempotent.

alter table public.pricing add column if not exists valid_from date;
alter table public.pricing add column if not exists valid_until date;   -- NULL = nog actief
alter table public.pricing add column if not exists source text;        -- 'manual' | 'market_research' | 'supplier_sync' | 'cbs_index'

-- Backfill bestaande rijen: actief vanaf created_at, bron handmatig.
update public.pricing set valid_from = created_at::date where valid_from is null;
update public.pricing set source = 'manual' where source is null;

create index if not exists idx_pricing_valid on public.pricing (item_name, valid_until);
